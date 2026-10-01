import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, requireAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    requireAuth(await getAuthUser(request))

    const now = new Date()
    const start = new Date(now.getTime() - 30 * 86400000)
    const end = new Date(now.getTime() + 30 * 86400000)

    const [events, rooms] = await Promise.all([
      prisma.calendarEvent.findMany({
        where: { startTime: { gte: start, lte: end } },
        select: { sourceModule: true, startTime: true, endTime: true, metadata: true },
      }),
      prisma.room.findMany(),
    ])

    const booked = new Map<string, number>()
    const dept = new Map<string, number>()
    const wd = [0, 0, 0, 0, 0, 0, 0]

    for (const e of events) {
      const loc = (e.metadata as any)?.location as string | undefined
      if (loc) {
        const hours = Math.max(0.5, (new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 3600000)
        booked.set(loc, (booked.get(loc) || 0) + hours)
      }
      dept.set(e.sourceModule, (dept.get(e.sourceModule) || 0) + 1)
      wd[new Date(e.startTime).getDay()]++
    }

    const WINDOW_HOURS = 60 * 9 // 60-day window, 9 working hours/day
    const roomStats = rooms
      .map(r => {
        const h = booked.get(r.label) || 0
        return {
          label: r.label,
          building: r.building,
          capacity: r.capacity,
          bookedHours: Math.round(h * 10) / 10,
          utilization: Math.min(100, Math.round((h / WINDOW_HOURS) * 100)),
        }
      })
      .sort((a, b) => b.utilization - a.utilization)

    const totalBooked = Array.from(booked.values()).reduce((a, b) => a + b, 0)
    const busiest = wd.map((count, i) => ({ day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i], count }))
      .sort((a, b) => b.count - a.count)[0]

    return NextResponse.json({
      success: true,
      rooms: roomStats,
      departments: Array.from(dept.entries()).map(([module, count]) => ({ module, count })).sort((a, b) => b.count - a.count),
      weekdays: wd.map((count, i) => ({ day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i], count })),
      totals: {
        events: events.length,
        bookedHours: Math.round(totalBooked),
        roomsTracked: rooms.length,
        busiestDay: busiest?.day ?? '—',
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }
}
