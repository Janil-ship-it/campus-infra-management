import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    requireAuth(await getAuthUser(request))
    const rooms = await prisma.room.findMany({
      orderBy: [{ building: 'asc' }, { roomNumber: 'asc' }],
    })
    return NextResponse.json({ success: true, rooms })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    console.error('GET /api/rooms error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
