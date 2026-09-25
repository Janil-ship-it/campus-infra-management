
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    requireAuth(await getAuthUser(request))
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.toLowerCase() || ''

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
          { positionTitle: { contains: query } },
        ],
      },
      select: {
        id: true,
        email: true,
        name: true,
        positionTitle: true,
      },
      take: 20,
    })

    return NextResponse.json({ success: true, users })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    console.error('GET /api/users/search error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
