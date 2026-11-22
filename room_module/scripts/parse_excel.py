"""
Parse CD Office Master Space Allocation.xlsx → list of space records (JSON).

Handles:
  - Standard sheets: Building | Room | Type | Allocation | Intended allocation,
    plus optional named columns after those fields, with floor header rows
  - AB7: single note about classrooms
  - AB8: Lal Minar
  - AB9: Floor | Allocation only
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

try:
    import openpyxl
except ImportError:
    print("ERROR: openpyxl is required. Run: pip install openpyxl", file=sys.stderr)
    sys.exit(1)

FLOOR_HEADERS = {
    "ground floor",
    "first floor",
    "second floor",
    "third floor",
    "fourth floor",
    "fifth floor",
    "all floors",
}


def normalize_room(val) -> str:
    if val is None:
        return ""
    if isinstance(val, float) and val == int(val):
        return str(int(val))
    return str(val).strip()


def is_floor_header(row) -> str | None:
    """If first cell is a floor name and rest empty → return floor name."""
    if not row or row[0] is None:
        return None
    first = str(row[0]).strip()
    if first.lower() in FLOOR_HEADERS:
        rest_empty = all(c is None or str(c).strip() == "" for c in row[1:])
        if rest_empty:
            return first
    return None


def parse_normal_sheet(ws, sheet_name: str) -> list[dict]:
    records = []
    current_floor = "Unknown"
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return records

    # Skip header row if it looks like column headers
    start = 0
    headers = []
    if rows[0] and rows[0][0] and str(rows[0][0]).strip().lower() in ("building", "floor"):
        start = 1
        headers = [str(value).strip() if value is not None else "" for value in rows[0]]

    for row in rows[start:]:
        if not row or all(c is None or str(c).strip() == "" for c in row):
            continue

        floor = is_floor_header(row)
        if floor:
            current_floor = floor
            continue

        # Expect: Building, Room, Type, Allocation, Intended allocation
        building = row[0]
        room = row[1] if len(row) > 1 else None
        typ = row[2] if len(row) > 2 else None
        allocation = row[3] if len(row) > 3 else None
        intended = row[4] if len(row) > 4 else None

        room_s = normalize_room(room)
        if not room_s:
            continue

        # Sometimes building cell is empty; use sheet name
        bld = str(building).strip() if building else sheet_name
        if bld.lower() in FLOOR_HEADERS:
            # Mis-detected; treat as floor change already handled
            continue

        additional_fields = {}
        for column_index in range(5, min(len(row), len(headers))):
            name = headers[column_index]
            value = row[column_index]
            if name and value is not None and str(value).strip():
                additional_fields[name] = str(value).strip()

        record = {
            "sheet": sheet_name,
            "floor": current_floor,
            "building": bld if bld else sheet_name,
            "room": room_s,
            "type": str(typ).strip() if typ else None,
            "allocation": str(allocation).strip() if allocation else None,
            "intended_allocation": str(intended).strip() if intended else None,
        }
        if additional_fields:
            record["additional_fields"] = additional_fields
        records.append(record)
    return records


def parse_ab7(ws, sheet_name: str) -> list[dict]:
    text = None
    for row in ws.iter_rows(values_only=True):
        if row and row[0]:
            text = str(row[0]).strip()
            break
    return [
        {
            "sheet": sheet_name,
            "floor": "All Floors",
            "building": sheet_name,
            "room": "All Classrooms",
            "type": "Classroom",
            "allocation": "Academic Affairs",
            "intended_allocation": text or "All classrooms allocated to Academic Affairs",
        }
    ]


def parse_ab8(ws, sheet_name: str) -> list[dict]:
    text = "Lal Minar"
    for row in ws.iter_rows(values_only=True):
        if row and row[0]:
            text = str(row[0]).strip()
            break
    return [
        {
            "sheet": sheet_name,
            "floor": "All Floors",
            "building": sheet_name,
            "room": text,
            "type": "Building",
            "allocation": text,
            "intended_allocation": None,
        }
    ]


def parse_ab9(ws, sheet_name: str) -> list[dict]:
    records = []
    rows = list(ws.iter_rows(values_only=True))
    start = 0
    if rows and rows[0] and str(rows[0][0]).strip().lower() == "floor":
        start = 1
    for row in rows[start:]:
        if not row or row[0] is None:
            continue
        floor = str(row[0]).strip()
        allocation = str(row[1]).strip() if len(row) > 1 and row[1] else None
        if floor.lower() in FLOOR_HEADERS or floor:
            records.append(
                {
                    "sheet": sheet_name,
                    "floor": floor,
                    "building": sheet_name,
                    "room": floor,
                    "type": "Area",
                    "allocation": allocation,
                    "intended_allocation": None,
                }
            )
    return records


def floor_rank(f: str) -> int:
    order = {
        "ground floor": 0,
        "first floor": 1,
        "second floor": 2,
        "third floor": 3,
        "fourth floor": 4,
        "fifth floor": 5,
        "all floors": 99,
    }
    return order.get((f or "").strip().lower(), 50)


def sheet_num(s: str) -> int:
    m = re.search(r"(\d+)", s or "")
    return int(m.group(1)) if m else 0


def parse_workbook(path: Path) -> list[dict]:
    wb = openpyxl.load_workbook(path, data_only=True)
    all_records: list[dict] = []

    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        name_u = sheet_name.upper()

        if name_u == "AB7":
            all_records.extend(parse_ab7(ws, sheet_name))
        elif name_u == "AB8":
            all_records.extend(parse_ab8(ws, sheet_name))
        elif name_u == "AB9":
            all_records.extend(parse_ab9(ws, sheet_name))
        else:
            all_records.extend(parse_normal_sheet(ws, sheet_name))

    all_records.sort(
        key=lambda d: (
            sheet_num(d.get("sheet", "")),
            floor_rank(d.get("floor", "")),
            str(d.get("room", "")),
        )
    )
    return all_records


def main():
    # Default locations relative to project root
    candidates = [
        Path("data") / "CD Office Master Space Allocation.xlsx",
        Path("CD Office Master Space Allocation.xlsx"),
        Path("public") / "CD Office Master Space Allocation.xlsx",
    ]
    if len(sys.argv) > 1:
        candidates.insert(0, Path(sys.argv[1]))

    xlsx = None
    for c in candidates:
        if c.exists():
            xlsx = c
            break
    if not xlsx:
        print("ERROR: Excel file not found. Looked in:", file=sys.stderr)
        for c in candidates:
            print(f"  {c.resolve()}", file=sys.stderr)
        sys.exit(1)

    records = parse_workbook(xlsx)

    out = Path("public") / "all_spaces.json"
    if not out.parent.exists():
        out = Path("all_spaces.json")

    out.write_text(json.dumps(records, indent=2), encoding="utf-8")
    if "--stdout" in sys.argv:
        # Machine-readable only (for API)
        sys.stdout.write(json.dumps(records))
    else:
        print(f"Wrote {len(records)} records to {out}")


if __name__ == "__main__":
    main()
