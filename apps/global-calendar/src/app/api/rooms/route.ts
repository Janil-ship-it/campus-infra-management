import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const building = searchParams.get('building')
  const minCapacity = searchParams.get('minCapacity')

  const where: any = {}
  if (building) where.building = building
  if (minCapacity) where.capacity = { gte: parseInt(minCapacity) }

  const rooms = await prisma.room.findMany({
    where,
    orderBy: [{ building: 'asc' }, { roomNumber: 'asc' }]
  })
  
  // Get unique buildings for filter dropdown
  const buildings = await prisma.room.findMany({
    select: { building: true },
    distinct: ['building'],
    orderBy: { building: 'asc' }
  })

  return NextResponse.json({ 
    success: true, 
    data: rooms,
    buildings: buildings.map(b => b.building)
  })
}
