import { PrismaClient } from '@prisma/client'
import { scryptSync, randomBytes } from 'node:crypto'
import { iitgnRooms } from './rooms-iitgn'

const prisma = new PrismaClient()

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt:${salt}:${hash}`
}

async function main() {
  console.log('🌱 Seeding database...')

  const ADMIN_EMAIL = 'dean.campus@iitgn.ac.in'
  const ADMIN_PASSWORD = 'Iitgn@deancampus'
  const adminHash = hashPassword(ADMIN_PASSWORD)

  const sushobhan = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      passwordHash: adminHash, isSystemAdmin: true,
      name: 'Prof. Sushobhan Sen', positionTitle: 'Dean, Campus Development (Project In-charge)',
    },
    create: {
      email: ADMIN_EMAIL, name: 'Prof. Sushobhan Sen',
      positionTitle: 'Dean, Campus Development (Project In-charge)',
      passwordHash: adminHash, isSystemAdmin: true,
    },
  })
  console.log(`✅ Super Admin (FIC ID): ${sushobhan.email}`)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@iitgn.ac.in' },
    update: { passwordHash: hashPassword('admin123'), isSystemAdmin: true },
    create: {
      email: 'admin@iitgn.ac.in', name: 'System Administrator', positionTitle: 'Admin',
      passwordHash: hashPassword('admin123'), isSystemAdmin: true,
    },
  })

  for (const user of [sushobhan, adminUser]) {
    await prisma.userModulePermission.upsert({
      where: { userId_moduleName: { userId: user.id, moduleName: 'GLOBAL' } },
      update: { canView: true, canEdit: true },
      create: { userId: user.id, moduleName: 'GLOBAL', canView: true, canEdit: true, grantedBy: user.id },
    })
  }

  // Seed REAL IITGN rooms
  const existingRooms = await prisma.room.count()
  if (existingRooms === 0) {
    await prisma.room.createMany({ data: iitgnRooms })
    console.log(`🏢 Seeded ${iitgnRooms.length} real IITGN rooms from VOIP directory`)
  } else {
    console.log(`⏭️  ${existingRooms} rooms already exist — skipping`)
  }

  const existingEvents = await prisma.calendarEvent.count()
  if (existingEvents === 0) {
    const sampleEvents = [
      {
        sourceModule: 'INFRASTRUCTURE', title: 'Electrical Maintenance - AB3 2nd Floor',
        description: 'Scheduled maintenance for electrical points',
        startTime: new Date('2026-09-25T10:00:00Z'), endTime: new Date('2026-09-25T12:00:00Z'),
        eventType: 'TASK', visibility: 'MODULE_ONLY',
        metadata: { location: 'AB3/311 — Campus Development', priority: 'HIGH' },
        createdBy: sushobhan.id,
      },
      {
        sourceModule: 'ACADEMIC_AFFAIRS', title: 'Senate Meeting',
        description: 'Quarterly academic review',
        startTime: new Date('2026-09-26T14:00:00Z'), endTime: new Date('2026-09-26T16:00:00Z'),
        eventType: 'MEETING', visibility: 'MODULE_ONLY',
        metadata: { location: 'AB3 Board Room — Main', attendees: 15 },
        createdBy: sushobhan.id,
      },
    ]

    for (const eventData of sampleEvents) {
      const event = await prisma.calendarEvent.create({ data: eventData })
      await prisma.auditLog.create({
        data: {
          action: 'CREATE', eventId: event.id, userId: sushobhan.id, ipAddress: '127.0.0.1',
          details: { sourceModule: eventData.sourceModule, title: eventData.title },
        },
      })
    }
    console.log(`📊 Created ${sampleEvents.length} sample events`)
  }

  console.log('✅ Base seeding completed!')
}

main()
  .catch((e) => { console.error('❌ Seeding failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
