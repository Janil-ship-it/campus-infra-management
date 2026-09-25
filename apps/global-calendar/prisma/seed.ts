// apps/global-calendar/prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create test permissions
  const adminPermission = await prisma.userModulePermission.upsert({
    where: {
      userId_moduleName: {
        userId: 1,
        moduleName: 'GLOBAL'
      }
    },
    update: {},
    create: {
      userId: 1,
      moduleName: 'GLOBAL',
      canView: true,
      canEdit: true,
      grantedBy: 1
    }
  })

  // Create sample events
  const sampleEvents = [
    {
      sourceModule: 'IWD',
      title: 'Electrical Maintenance - AB3 2nd Floor',
      description: 'Scheduled maintenance for electrical points',
      startTime: new Date('2026-09-25T10:00:00Z'),
      endTime: new Date('2026-09-25T12:00:00Z'),
      eventType: 'TASK',
      visibility: 'MODULE_ONLY',
      metadata: { work_order_id: 12345, priority: 'HIGH' },
      createdBy: 1
    },
    {
      sourceModule: 'FINANCE',
      title: 'Budget Review Meeting',
      description: 'Quarterly budget review with all departments',
      startTime: new Date('2026-09-26T14:00:00Z'),
      endTime: new Date('2026-09-26T16:00:00Z'),
      eventType: 'MEETING',
      visibility: 'MODULE_ONLY',
      metadata: { attendees: 15, location: 'Board Room' },
      createdBy: 1
    },
    {
      sourceModule: 'ADMIN',
      title: 'Institute Holiday - Gandhi Jayanti',
      description: 'Institute closed for Gandhi Jayanti',
      startTime: new Date('2026-10-02T00:00:00Z'),
      endTime: new Date('2026-10-02T23:59:59Z'),
      isAllDay: true,
      eventType: 'REMINDER',
      visibility: 'PUBLIC',
      createdBy: 1
    },
    {
      sourceModule: 'RND',
      title: 'Research Grant Deadline',
      description: 'Deadline for submitting research grant proposals',
      startTime: new Date('2026-09-30T23:59:59Z'),
      endTime: new Date('2026-09-30T23:59:59Z'),
      eventType: 'DEADLINE',
      visibility: 'PUBLIC',
      metadata: { grant_type: 'Internal', max_amount: '500000' },
      createdBy: 1
    },
    {
      sourceModule: 'ROOM_INFO',
      title: 'Room Allocation Review',
      description: 'Review of room allocations for next semester',
      startTime: new Date('2026-10-05T11:00:00Z'),
      endTime: new Date('2026-10-05T13:00:00Z'),
      eventType: 'MEETING',
      visibility: 'ADMIN_ONLY',
      metadata: { buildings: ['AB1', 'AB2', 'AB3'] },
      createdBy: 1
    }
  ]

  for (const eventData of sampleEvents) {
    const event = await prisma.calendarEvent.create({
      data: eventData
    })

    // Create audit log for each event
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        eventId: event.id,
        userId: 1,
        ipAddress: '127.0.0.1',
        details: {
          sourceModule: eventData.sourceModule,
          title: eventData.title
        }
      }
    })
  }

  console.log('✅ Seeding completed successfully!')
  console.log(`📊 Created ${sampleEvents.length} sample events`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })