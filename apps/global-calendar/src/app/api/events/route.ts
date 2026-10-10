import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createEventSchema, eventQuerySchema } from '@/lib/validators'
import { getAuthUser, requireAuth, canAccessModule, getVisibleModules } from '@/lib/auth'
import { safeJson } from '@/lib/serialize'
import { extractRoomKeys, findRoomConflicts, conflictMessage } from '@/lib/conflicts'

export const dynamic = 'force-dynamic';

function clientIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
}

function fail(error: unknown, context: string) {
  if (error instanceof z.ZodError) {
    return NextResponse.json({ success: false, errors: error.issues }, { status: 400 })
  }
  if (error instanceof Error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    if (error.message.startsWith('Forbidden')) {
      return NextResponse.json({ success: false, message: error.message }, { status: 403 })
    }
  }
  console.error(`${context} error:`, error)
  return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(await getAuthUser(request))
    const validated = createEventSchema.parse(await request.json())

    if (!(await canAccessModule(user, validated.sourceModule, 'edit'))) {
      return NextResponse.json(
        { success: false, message: `Forbidden: no edit access to ${validated.sourceModule}` },
        { status: 403 }
      )
    }

    if (!validated.recurrenceRule) {
      const roomKeys = extractRoomKeys(validated.metadata ?? {})
      if (roomKeys.length > 0) {
        const conflicts = await findRoomConflicts(prisma, validated.startTime, validated.endTime, roomKeys)
        if (conflicts.length > 0) {
          return NextResponse.json(
            { success: false, code: 'ROOM_CONFLICT', message: conflictMessage(conflicts), conflicts },
            { status: 409 }
          )
        }
      }
    }

    const event = await prisma.$transaction(async (tx) => {
      const created = await tx.calendarEvent.create({
        data: {
          sourceModule: validated.sourceModule,
          title: validated.title,
          description: validated.description,
          startTime: validated.startTime,
          endTime: validated.endTime,
          isAllDay: validated.isAllDay,
          eventType: validated.eventType,
          visibility: validated.visibility,
          recurrenceRule: validated.recurrenceRule,
          metadata: (validated.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
          createdBy: user.id,
          participants: validated.participants
            ? { create: validated.participants.map((p) => ({ userId: p.userId, role: p.role })) }
            : undefined,
        },
        include: { participants: true },
      })

      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          eventId: created.id,
          userId: user.id,
          ipAddress: clientIp(request),
          details: { sourceModule: validated.sourceModule, title: validated.title },
        },
      })

      return created
    })

    return NextResponse.json({ success: true, event: safeJson(event) }, { status: 201 })
  } catch (error) {
    return fail(error, 'POST /api/events')
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(await getAuthUser(request))
    const { searchParams } = new URL(request.url)
    const query = eventQuerySchema.parse(Object.fromEntries(searchParams))

    const where: Prisma.CalendarEventWhereInput = { status: 'ACTIVE' }

    if (query.sourceModule) where.sourceModule = query.sourceModule
    if (query.eventType) where.eventType = query.eventType
    if (query.visibility) where.visibility = query.visibility
    if (query.startTime || query.endTime) {
      where.AND = [
        ...(query.startTime ? [{ endTime: { gte: query.startTime } }] : []),
        ...(query.endTime ? [{ startTime: { lte: query.endTime } }] : []),
      ]
    }

    const visible = await getVisibleModules(user)
    if (visible !== null) {
      where.OR = [
        { visibility: 'PUBLIC' },
        { sourceModule: { in: visible }, visibility: { not: 'ADMIN_ONLY' } },
      ]
    }

    const [events, total] = await Promise.all([
      prisma.calendarEvent.findMany({
        where,
        include: { participants: true },
        orderBy: { startTime: 'asc' },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.calendarEvent.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      events: safeJson(events),
      meta: { total, limit: query.limit, offset: query.offset, hasMore: query.offset + query.limit < total },
    })
  } catch (error) {
    return fail(error, 'GET /api/events')
  }
}
