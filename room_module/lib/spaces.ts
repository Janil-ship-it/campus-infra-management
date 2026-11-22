import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';

export type SpaceRecord = {
  sheet: string;
  floor: string;
  building: string;
  room: string;
  type: string | null;
  allocation: string | null;
  intended_allocation: string | null;
  additional_fields?: Record<string, string | null>;
};

function projectRoot(): string {
  return process.cwd();
}

export function excelPath(): string {
  const candidates = [
    path.join(projectRoot(), 'data', 'CD Office Master Space Allocation.xlsx'),
    path.join(projectRoot(), 'CD Office Master Space Allocation.xlsx'),
    path.join(projectRoot(), 'public', 'CD Office Master Space Allocation.xlsx'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

export function jsonPath(): string {
  const publicPath = path.join(projectRoot(), 'public', 'all_spaces.json');
  if (fs.existsSync(path.dirname(publicPath))) return publicPath;
  return path.join(projectRoot(), 'all_spaces.json');
}

export function parseScriptPath(): string {
  return path.join(projectRoot(), 'scripts', 'parse_excel.py');
}

function runExcelParser(script: string, xlsx: string): void {
  const commands = process.platform === 'win32'
    ? [
        { executable: 'python', prefixArgs: [] },
        { executable: 'py', prefixArgs: ['-3'] },
      ]
    : [
        { executable: 'python3', prefixArgs: [] },
        { executable: 'python', prefixArgs: [] },
      ];

  let lastError: unknown;
  for (const command of commands) {
    try {
      execFileSync(command.executable, [...command.prefixArgs, script, xlsx], {
        cwd: projectRoot(),
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      });
      return;
    } catch (error) {
      lastError = error;
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }

  const missingCommands = commands.map(({ executable }) => executable).join(' or ');
  const detail = (lastError as NodeJS.ErrnoException | undefined)?.message;
  throw new Error(
    `Python was not found (${missingCommands}). Install Python 3 and add it to PATH.${detail ? ` ${detail}` : ''}`,
  );
}

export function syncFromExcel(): { ok: boolean; count?: number; error?: string; records?: SpaceRecord[] } {
  const xlsx = excelPath();
  if (!fs.existsSync(xlsx)) {
    return {
      ok: false,
      error: `Excel not found. Put the file at: data/CD Office Master Space Allocation.xlsx`,
    };
  }

  const script = parseScriptPath();
  if (!fs.existsSync(script)) {
    return { ok: false, error: `Parser script missing: ${script}` };
  }

  try {
    runExcelParser(script, xlsx);
    const records = readSpacesJson();
    return { ok: true, count: records.length, records };
  } catch (e: unknown) {
    const error = e as NodeJS.ErrnoException & { stderr?: Buffer | string };
    const stderr = error.stderr?.toString().trim();
    const msg = stderr || error.message || String(e);
    return { ok: false, error: `Failed to parse Excel: ${msg}` };
  }
}

export async function syncFromGoogleSheet(url: string): Promise<{
  ok: boolean;
  count?: number;
  error?: string;
  records?: SpaceRecord[];
}> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
    if (!response.ok) {
      return { ok: false, error: `Google Sheets returned HTTP ${response.status}` };
    }

    const payload: unknown = await response.json();
    if (
      typeof payload !== 'object' ||
      payload === null ||
      ('success' in payload && payload.success === false) ||
      !('data' in payload) ||
      !Array.isArray(payload.data)
    ) {
      const errorMessage =
        typeof payload === 'object' &&
        payload !== null &&
        'error' in payload &&
        typeof payload.error === 'string'
          ? payload.error
          : 'Google Sheets returned an invalid response. Expected a data array.';
      return { ok: false, error: errorMessage };
    }

    const records = payload.data as SpaceRecord[];
    const validRecords = records.every(
      (record) =>
        record &&
        typeof record.sheet === 'string' &&
        typeof record.floor === 'string' &&
        typeof record.building === 'string' &&
        typeof record.room === 'string',
    );
    if (!validRecords) {
      return { ok: false, error: 'Google Sheets returned records missing required room fields.' };
    }

    const outputPath = jsonPath();
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(records, null, 2), 'utf-8');
    return { ok: true, count: records.length, records };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: `Failed to sync from Google Sheets: ${message}` };
  }
}

export function readSpacesJson(): SpaceRecord[] {
  const p = jsonPath();
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as SpaceRecord[];
  } catch {
    return [];
  }
}

export function getSpaces(opts?: { forceSync?: boolean }): {
  records: SpaceRecord[];
  source: 'excel' | 'json' | 'empty';
  synced?: boolean;
  error?: string;
} {
  const xlsx = excelPath();
  const json = jsonPath();

  if (opts?.forceSync) {
    const result = syncFromExcel();
    if (result.ok && result.records) {
      return { records: result.records, source: 'excel', synced: true };
    }
    return {
      records: readSpacesJson(),
      source: 'json',
      synced: false,
      error: result.error,
    };
  }

  if (fs.existsSync(xlsx)) {
    const excelMtime = fs.statSync(xlsx).mtimeMs;
    const jsonMtime = fs.existsSync(json) ? fs.statSync(json).mtimeMs : 0;
    if (excelMtime > jsonMtime) {
      const result = syncFromExcel();
      if (result.ok && result.records) {
        return { records: result.records, source: 'excel', synced: true };
      }
    }
  }

  const records = readSpacesJson();
  if (records.length === 0) {
    return { records: [], source: 'empty', error: 'No data. Place Excel in data/ and sync.' };
  }
  return { records, source: 'json' };
}
