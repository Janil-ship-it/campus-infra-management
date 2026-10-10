import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { validateServiceKey } from '@/lib/service-keys'
import { createEventSchema } from '@/lib/validators'

const INTERNAL_RATE_LIMIT = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 100 // 100 requests per minute

function checkRateLimit(keyId: number): boolean {
  const now = Date.now()
  const key = `rate:${keyId}`
  const record = INTERNAL_RATE_LIMIT.get(key)

  if (!record || now > record.resetTime) {
    INTERNAL_RATE_LIMIT.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }

  record.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Validate API key from Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid Authorization header. Use: Bearer sk_...' },
        { status: 401 }
      )
    }

    const apiKey = authHeader.substring(7) // Remove "Bearer "
    const serviceKey = await validateServiceKey(apiKey)

    if (!serviceKey) {
      return NextResponse.json(
        { success: false, message: 'Invalid or inactive API key' },
        { status: 401 }
      )
    }

    // Rate limiting
    if (!checkRateLimit(serviceKey.id)) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded. Max 100 requests per minute.' },
        { status: 429 }
      )
    }

    // Validate request body
    const body = await request.json()
    const validated = createEventSchema.parse(body)

    // Check module permissions
    const permissions = serviceKey.permissions as any
    if (!permissions.canCreate || !permissions.allowedModules?.includes(validated.sourceModule)) {
      return NextResponse.json(
        { success: false, message: `Service key does not have permission to create ${validated.sourceModule} events` },
        { status: 403 }
      )
    }

    // Create event
    const event = await prisma.calendarEvent.create({
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
        metadata: validated.metadata as any,
        createdBy: serviceKey.id, // Use service key ID as creator
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        eventId: event.id,
        userId: 0, // System user
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        details: {
          source: 'service-api',
          serviceKeyName: serviceKey.name,
          sourceModule: validated.sourceModule,
          title: validated.title,
        },
      },
    })

    return NextResponse.json({
      success: true,
      event: {
        id: event.id.toString(),
        sourceModule: event.sourceModule,
        title: event.title,
        startTime: event.startTime,
        endTime: event.endTime,
      },
      message: 'Event created successfully',
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: 'Validation error', errors: error.issues },
        { status: 400 }
      )
    }
    console.error('POST /api/internal/events error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid Authorization header' },
        { status: 401 }
      )
    }

    const apiKey = authHeader.substring(7)
    const serviceKey = await validateServiceKey(apiKey)

    if (!serviceKey) {
      return NextResponse.json(
        { success: false, message: 'Invalid or inactive API key' },
        { status: 401 }
      )
    }

    // Return recent events for this module
    const events = await prisma.calendarEvent.findMany({
      where: {
        sourceModule: serviceKey.moduleName,
        status: 'ACTIVE',
      },
      orderBy: { startTime: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      success: true,
      events: events.map((e) => ({
        id: e.id.toString(),
        title: e.title,
        startTime: e.startTime,
        endTime: e.endTime,
        eventType: e.eventType,
      })),
    })
  } catch (error) {
    console.error('GET /api/internal/events error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
