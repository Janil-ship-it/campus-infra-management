# Campus Infra Management (Campus Sanchalika)

A unified platform for managing infrastructure operations at IIT Gandhinagar. Built as a modular Next.js 14 monorepo with role-based access control, audit logging, and data localization on the AV5 campus data center.

## Architecture

campus-infra-management/
├── apps/
│ └── global-calendar/ ← Unified event hub (this PR)
│ └── admin/ ← (planned) Admin operations
│ └── room-info/ ← (planned) Room allocation module
│ └── iwd/ ← (planned) Infrastructure Works Division
├── docs/
│ └── api-contracts/ ← Module integration specs
└── package.json  

### Design Principles
- **Hub-and-spoke architecture** — each module owns its own database schema but integrates via REST APIs
- **"Mind Your Own Business" RBAC** — users see only events from modules they're authorized to access
- **Position-based accounts** — emails like `se@iitgn.ac.in` outlive individual staff (per stakeholder requirement)
- **Complete audit trail** — every write operation logged with user ID, IP, and before/after state

## Modules

### Global Calendar (Active Development)
Unified event hub for IWD, Finance, R&D, HMS, Room Info, and Admin modules. Features:
- Interactive FullCalendar with color-coded events by department
- Recurring event support (iCal RRULE)
- Room conflict detection with live availability checking
- Command palette (⌘K) for instant search and navigation
- Admin delegation dashboard for permission management

**See:** [`apps/global-calendar/README.md`](apps/global-calendar/README.md) for setup and API contract.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | MySQL 8.0 + Prisma ORM |
| Auth | Custom JWT (jose) with httpOnly cookies |
| UI | Tailwind CSS + shadcn/ui components |
| Calendar | FullCalendar v5 + RRule plugin |
| Deployment | Docker (planned for AV5 data center) |

## Development Setup

```bash
# Clone and install
git clone git@github.com:Janil-ship-it/campus-infra-management.git
cd campus-infra-management
npm install

# Start a specific module (example: Global Calendar)
cd apps/global-calendar
cp .env.example .env  # Configure DATABASE_URL and JWT_SECRET
npx prisma migrate dev
node prisma/seed.mjs  # Populate with dev users + sample data
npm run dev 
Deployment
Production deployment targets the AV5 data center at IIT Gandhinagar with:
Data localization (no cloud databases)
Docker containerization
MySQL on-campus instance
Internal network access only
Status: Active development. Global Calendar module in beta testing.
License: Proprietary (IIT Gandhinagar internal use)
