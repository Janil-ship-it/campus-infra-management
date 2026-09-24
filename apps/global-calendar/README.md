# Global Calendar Module (Campus Sanchalika)

Unified event hub for IITGN campus modules. Owned by: Srimaan (Global Calendar).

## Setup
1. npm install
2. cp .env.example .env   (fill real values)
3. npx prisma migrate dev
4. node prisma/seed.mjs   (dev data + dummy users)
5. npm run dev

## Dev accounts
| Email | Password | Role |
|---|---|---|
| admin@iitgn.ac.in | admin@123 | System Admin |
| dean@iitgn.ac.in | dean@123 | Delegated Admin |
| se@iitgn.ac.in | se@123 | IWD edit + Room Info view |
| finance@iitgn.ac.in | fin@123 | Finance edit |
| clerk@iitgn.ac.in | clerk@123 | No permissions |

## Scripts
- npm run dev / build / start
- npm run db:migrate / db:studio

## Rules for other modules
Do NOT write to this module's database directly. Push/pull events via REST
(see docs/api-contracts/global-calendar-api.md at repo root docs folder).
Service API keys for module-to-module auth arrive in Phase 6.
