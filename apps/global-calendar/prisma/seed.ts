import { PrismaClient } from '@prisma/client'
import { scryptSync, randomBytes } from 'node:crypto'

const prisma = new PrismaClient()

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

async function main() {
  console.log('🌱 Seeding database...')

  // SUPER ADMIN
  const sushobhanPassword = hashPassword('Sushobhan@123')
  const sushobhan = await prisma.user.upsert({
    where: { email: 'sushobhan@iitgn.ac.in' },
    update: { passwordHash: sushobhanPassword, isSystemAdmin: true },
    create: {
      email: 'sushobhan@iitgn.ac.in',
      name: 'Prof. Sushobhan Sen',
      positionTitle: 'Dean, Campus Development (Project In-charge)',
      passwordHash: sushobhanPassword,
      isSystemAdmin: true,
    },
  })
  
  const adminPassword = hashPassword('admin123')
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@iitgn.ac.in' },
    update: { passwordHash: adminPassword, isSystemAdmin: true },
    create: { email: 'admin@iitgn.ac.in', name: 'System Administrator', positionTitle: 'Admin', passwordHash: adminPassword, isSystemAdmin: true },
  })

  for (const user of [sushobhan, adminUser]) {
    await prisma.userModulePermission.upsert({
      where: { userId_moduleName: { userId: user.id, moduleName: 'GLOBAL' } },
      update: {},
      create: { userId: user.id, moduleName: 'GLOBAL', canView: true, canEdit: true, grantedBy: user.id },
    })
  }

  // SEED IITGN ROOMS
  const existingRooms = await prisma.room.count()
  if (existingRooms === 0) {
    const iitgnRooms = [
      // Academic Blocks
      { building: 'AB1', roomNumber: '101', label: 'AB1-101 (Lecture)', purpose: 'Classroom', capacity: 60 },
      { building: 'AB1', roomNumber: '205', label: 'AB1-205 (Seminar)', purpose: 'Seminar Hall', capacity: 120 },
      { building: 'AB2', roomNumber: '102', label: 'AB2-102 (Lab)', purpose: 'Computer Lab', capacity: 40 },
      { building: 'AB3', roomNumber: '301', label: 'AB3-301 (Smart Class)', purpose: 'Classroom', capacity: 50 },
      { building: 'AB4', roomNumber: 'G01', label: 'AB4-G01 (Design Studio)', purpose: 'Studio', capacity: 30 },
      { building: 'AB5', roomNumber: '204', label: 'AB5-204 (Research Lab)', purpose: 'Laboratory', capacity: 20 },
      
      // Lecture Hall Complex (LHC)
      { building: 'LHC', roomNumber: 'LH-1', label: 'LHC-LH1 (Main Auditorium)', purpose: 'Auditorium', capacity: 500 },
      { building: 'LHC', roomNumber: 'LH-2', label: 'LHC-LH2 (Lecture Hall)', purpose: 'Lecture Hall', capacity: 200 },
      { building: 'LHC', roomNumber: 'LH-3', label: 'LHC-LH3 (Lecture Hall)', purpose: 'Lecture Hall', capacity: 200 },
      { building: 'LHC', roomNumber: 'LH-4', label: 'LHC-LH4 (Tutorial)', purpose: 'Tutorial Room', capacity: 40 },
      
      // Core Building & Admin
      { building: 'Core Building', roomNumber: 'CB-101', label: 'Board Room (CB1)', purpose: 'Meeting Room', capacity: 20 },
      { building: 'Core Building', roomNumber: 'CB-201', label: 'Director Conference Room', purpose: 'Meeting Room', capacity: 15 },
      { building: 'Core Building', roomNumber: 'CB-Audi', label: 'Core Auditorium', purpose: 'Auditorium', capacity: 300 },
      
      // Student Activity Centre (SAC)
      { building: 'SAC', roomNumber: 'SAC-Audi', label: 'SAC Auditorium', purpose: 'Auditorium', capacity: 800 },
      { building: 'SAC', roomNumber: 'SAC-101', label: 'SAC Committee Room', purpose: 'Meeting Room', capacity: 25 },
      { building: 'SAC', roomNumber: 'SAC-Gym', label: 'SAC Gymnasium', purpose: 'Sports Facility', capacity: 100 },
      
      // Library & Others
      { building: 'Library', roomNumber: 'LIB-Sem', label: 'Library Seminar Hall', purpose: 'Seminar Hall', capacity: 150 },
      { building: 'Library', roomNumber: 'LIB-Disc', label: 'Library Discussion Room', purpose: 'Meeting Room', capacity: 10 },
      { building: 'Guest House', roomNumber: 'GH-Dining', label: 'Guest House Dining Hall', purpose: 'Dining', capacity: 60 },
      { building: 'Guest House', roomNumber: 'GH-Lounge', label: 'Guest House Lounge', purpose: 'Lounge', capacity: 20 },
    ]
    
    await prisma.room.createMany({ data: iitgnRooms })
    console.log(`🏢 Seeded ${iitgnRooms.length} IITGN rooms`)
  }

  // Sample Events
  const existingEvents = await prisma.calendarEvent.count()
  if (existingEvents === 0) {
    const sampleEvents = [
      {
        sourceModule: 'INFRASTRUCTURE',
        title: 'Electrical Maintenance - AB3 2nd Floor',
        description: 'Scheduled maintenance for electrical points',
        startTime: new Date('2026-09-25T10:00:00Z'),
        endTime: new Date('2026-09-25T12:00:00Z'),
        eventType: 'TASK',
        visibility: 'MODULE_ONLY',
        metadata: { work_order_id: 12345, priority: 'HIGH' },
        createdBy: sushobhan.id,
      },
      {
        sourceModule: 'ACADEMIC_AFFAIRS',
        title: 'Senate Meeting',
        description: 'Quarterly academic review',
        startTime: new Date('2026-09-26T14:00:00Z'),
        endTime: new Date('2026-09-26T16:00:00Z'),
        eventType: 'MEETING',
        visibility: 'MODULE_ONLY',
        metadata: { room: 'Board Room (CB1)', attendees: 15 },
        createdBy: sushobhan.id,
      },
    ]

    for (const eventData of sampleEvents) {
      const event = await prisma.calendarEvent.create({ data: eventData })
      await prisma.auditLog.create({
        data: {
          action: 'CREATE',
          eventId: event.id,
          userId: sushobhan.id,
          ipAddress: '127.0.0.1',
          details: { sourceModule: eventData.sourceModule, title: eventData.title },
        },
      })
    }
  }

  console.log('✅ Base seeding completed!')
}

main()
  .catch((e) => { console.error('❌ Seeding failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
