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

  // SOLE SUPER ADMIN — Prof. Sushobhan Sen (Project Mentor)
  // Real FIC ID from the IITGN directory
  const ADMIN_EMAIL = 'assoc.dean.space@iitgn.ac.in'
  const ADMIN_PASSWORD = 'Iitgn@assocdeanspace'
  const adminHash = hashPassword(ADMIN_PASSWORD)

  const mentor = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      passwordHash: adminHash,
      isSystemAdmin: true,
      name: 'Prof. Sushobhan Sen',
      positionTitle: 'Associate Dean, Campus and Space Management (Project Mentor)',
    },
    create: {
      email: ADMIN_EMAIL,
      name: 'Prof. Sushobhan Sen',
      positionTitle: 'Associate Dean, Campus and Space Management (Project Mentor)',
      passwordHash: adminHash,
      isSystemAdmin: true,
    },
  })
  console.log(`✅ Sole Super Admin: ${mentor.email}`)

  // Demote previous admin + restore his true FIC identity
  await prisma.user.updateMany({
    where: { email: 'dean.campus@iitgn.ac.in' },
    data: {
      isSystemAdmin: false,
      name: 'Dean, Campus Development',
      positionTitle: 'Dean, Campus Development',
    },
  })

  // Retire the dev admin account permanently
  await prisma.user.updateMany({
    where: { email: 'admin@iitgn.ac.in' },
    data: { isSystemAdmin: false, passwordHash: 'RETIRED' },
  })

  // GLOBAL permission for the mentor
  await prisma.userModulePermission.upsert({
    where: { userId_moduleName: { userId: mentor.id, moduleName: 'GLOBAL' } },
    update: { canView: true, canEdit: true },
    create: { userId: mentor.id, moduleName: 'GLOBAL', canView: true, canEdit: true, grantedBy: mentor.id },
  })

  // Rooms (only if empty)
  const existingRooms = await prisma.room.count()
  if (existingRooms === 0) {
    await prisma.room.createMany({ data: iitgnRooms })
    console.log(`🏢 Seeded ${iitgnRooms.length} real IITGN rooms`)
  }

  console.log('✅ Base seeding completed!')
}

main()
  .catch((e) => { console.error('❌ Seeding failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
