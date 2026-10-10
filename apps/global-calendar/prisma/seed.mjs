import { PrismaClient } from '@prisma/client'
import { scryptSync, randomBytes } from 'node:crypto'

const prisma = new PrismaClient()

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

const d = (s) => new Date(s)

const USERS = [
  { email: 'admin@iitgn.ac.in',   name: 'System Administrator', positionTitle: 'System Administrator',    password: 'admin@123', isSystemAdmin: true  },
  { email: 'dean@iitgn.ac.in',    name: 'Dean (Policy)',          positionTitle: 'Dean, Infrastructure',    password: 'dean@123',  isSystemAdmin: true  },
  { email: 'se@iitgn.ac.in',      name: 'Superintending Engineer',positionTitle: 'Superintending Engineer', password: 'se@123',    isSystemAdmin: false },
  { email: 'finance@iitgn.ac.in', name: 'Finance Officer',        positionTitle: 'Finance Officer',         password: 'fin@123',   isSystemAdmin: false },
  { email: 'clerk@iitgn.ac.in',   name: 'Section Clerk',          positionTitle: 'Section Clerk (New)',     password: 'clerk@123', isSystemAdmin: false },
]

const PERMISSIONS = [
  { email: 'se@iitgn.ac.in',      moduleName: 'IWD',       canView: true, canEdit: true  },
  { email: 'se@iitgn.ac.in',      moduleName: 'ROOM_INFO', canView: true, canEdit: false },
  { email: 'finance@iitgn.ac.in', moduleName: 'FINANCE',   canView: true, canEdit: true  },
]

const ROOMS = [
  { building: 'AB1',  roomNumber: '101',     purpose: 'CLASSROOM',   capacity: 60  },
  { building: 'AB1',  roomNumber: '102',     purpose: 'CLASSROOM',   capacity: 60  },
  { building: 'AB1',  roomNumber: '201-202', purpose: 'CLASSROOM',   capacity: 120 },
  { building: 'AB2',  roomNumber: '101',     purpose: 'CLASSROOM',   capacity: 60  },
  { building: 'AB2',  roomNumber: '201-202', purpose: 'CLASSROOM',   capacity: 120 },
  { building: 'AB3',  roomNumber: '201-202', purpose: 'CLASSROOM',   capacity: 120 },
  { building: 'AB3',  roomNumber: '203-204', purpose: 'CLASSROOM',   capacity: 120 },
  { building: 'AB3',  roomNumber: '303',     purpose: 'BOARD_ROOM',  capacity: 20  },
  { building: 'AB6',  roomNumber: '101',     purpose: 'LAB',         capacity: 40  },
  { building: 'AB6',  roomNumber: '102',     purpose: 'LAB',         capacity: 40  },
  { building: 'AB11', roomNumber: '201',     purpose: 'LAB',         capacity: 30  },
  { building: 'AB11', roomNumber: '202',     purpose: 'LAB',         capacity: 30  },
  { building: 'AB11', roomNumber: '203',     purpose: 'LAB',         capacity: 30  },
  { building: 'AB13', roomNumber: '101',     purpose: 'OFFICE',      capacity: 10  },
  { building: 'AB13', roomNumber: '102',     purpose: 'OFFICE',      capacity: 10  },
  { building: 'LHC',  roomNumber: '101',     purpose: 'AUDITORIUM',  capacity: 200 },
  { building: 'LHC',  roomNumber: '102',     purpose: 'AUDITORIUM',  capacity: 200 },
]

// Times stored as UTC but chosen so IST wall-clock reads naturally (IST = UTC+5:30)
const EVENTS = [
  { sourceModule: 'IWD', title: 'Electrical Maintenance - AB3 2nd Floor', eventType: 'TASK',
    startTime: d('2026-10-05T04:30:00Z'), endTime: d('2026-10-05T06:30:00Z'),
    visibility: 'MODULE_ONLY', metadata: { room: 'AB3-201-202', priority: 'HIGH' } },
  { sourceModule: 'IWD', title: 'Plumbing inspection - AB6 Ground Floor', eventType: 'TASK',
    startTime: d('2026-10-07T03:00:00Z'), endTime: d('2026-10-07T04:30:00Z'),
    visibility: 'MODULE_ONLY', metadata: { room: 'AB6-101', priority: 'MEDIUM' } },
  { sourceModule: 'FINANCE', title: 'Renew fire safety certificate (OVERDUE)', eventType: 'REMINDER',
    startTime: d('2026-10-01T03:30:00Z'), endTime: d('2026-10-01T04:00:00Z'),
    visibility: 'ADMIN_ONLY', metadata: { certificate: 'FSC-2024-118' } },
  { sourceModule: 'FINANCE', title: 'Quarterly budget review', eventType: 'MEETING',
    startTime: d('2026-10-12T08:30:00Z'), endTime: d('2026-10-12T10:30:00Z'),
    visibility: 'MODULE_ONLY', metadata: { room: 'AB3-303' } },
  { sourceModule: 'RND', title: 'Internal research grant submission deadline', eventType: 'DEADLINE',
    startTime: d('2026-10-15T13:00:00Z'), endTime: d('2026-10-15T13:00:00Z'),
    visibility: 'PUBLIC' },
  { sourceModule: 'ROOM_INFO', title: "Tinkerer's Lab (AB11-201..203) handover to Design", eventType: 'MILESTONE',
    startTime: d('2026-10-20T03:30:00Z'), endTime: d('2026-10-20T11:30:00Z'),
    visibility: 'MODULE_ONLY', metadata: { rooms: ['AB11-201', 'AB11-202', 'AB11-203'] } },
  { sourceModule: 'ADMIN', title: 'Institute Holiday - Gandhi Jayanti', eventType: 'REMINDER',
    startTime: d('2026-10-02T00:00:00Z'), endTime: d('2026-10-02T23:59:59Z'),
    isAllDay: true, visibility: 'PUBLIC' },
]

async function main() {
  console.log('Resetting dev data...')
  await prisma.auditLog.deleteMany()
  await prisma.eventParticipant.deleteMany()
  await prisma.calendarEvent.deleteMany()
  await prisma.userModulePermission.deleteMany()
  await prisma.room.deleteMany()
  await prisma.user.deleteMany()

  const byEmail = {}
  for (const u of USERS) {
    const created = await prisma.user.create({
      data: {
        email: u.email, name: u.name, positionTitle: u.positionTitle,
        passwordHash: hashPassword(u.password), isSystemAdmin: u.isSystemAdmin,
      },
    })
    byEmail[u.email] = created.id
  }

  for (const p of PERMISSIONS) {
    await prisma.userModulePermission.create({
      data: { userId: byEmail[p.email], moduleName: p.moduleName, canView: p.canView, canEdit: p.canEdit, grantedBy: byEmail['admin@iitgn.ac.in'] },
    })
  }

  for (const r of ROOMS) {
    await prisma.room.create({ data: { ...r, label: `${r.building}-${r.roomNumber}` } })
  }

  for (const e of EVENTS) {
    const created = await prisma.calendarEvent.create({ data: { ...e, createdBy: byEmail['admin@iitgn.ac.in'] } })
    await prisma.auditLog.create({
      data: { action: 'CREATE', eventId: created.id, userId: byEmail['admin@iitgn.ac.in'], ipAddress: '127.0.0.1',
              details: { sourceModule: e.sourceModule, title: e.title, seeded: true } },
    })
  }

  console.log(`Seeded ${USERS.length} users, ${ROOMS.length} rooms, ${EVENTS.length} events.`)
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
