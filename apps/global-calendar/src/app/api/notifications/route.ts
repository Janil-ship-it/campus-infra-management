import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(await getAuthUser(request))

    const pendingInvites = await prisma.eventParticipant.findMany({
      where: {
        userId: user.id,
        rsvpStatus: 'PENDING',
        event: { status: 'ACTIVE' },
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            sourceModule: true,
          },
        },
      },
      orderBy: { event: { startTime: 'asc' } },
      take: 10,
    })

    return NextResponse.json({
      success: true,
      notifications: pendingInvites.map((p) => ({
        eventId: p.event.id.toString(),
        eventTitle: p.event.title,
        startTime: p.event.startTime.toISOString(),
        endTime: p.event.endTime.toISOString(),
        sourceModule: p.event.sourceModule,
        role: p.role,
      })),
      count: pendingInvites.length,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    console.error('GET /api/notifications error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
