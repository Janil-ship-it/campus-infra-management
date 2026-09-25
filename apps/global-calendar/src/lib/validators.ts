import { z } from 'zod'

export const SOURCE_MODULES = ['IWD', 'FINANCE', 'RND', 'HMS', 'ROOM_INFO', 'ADMIN'] as const
export const PERMISSION_MODULES = ['IWD', 'FINANCE', 'RND', 'HMS', 'ROOM_INFO', 'ADMIN', 'GLOBAL'] as const
export const EVENT_TYPES = ['MEETING', 'TASK', 'DEADLINE', 'REMINDER', 'MILESTONE'] as const
export const VISIBILITIES = ['PUBLIC', 'MODULE_ONLY', 'ADMIN_ONLY'] as const

// Shared base — used for both create and update
const eventBase = z.object({
  sourceModule: z.enum(SOURCE_MODULES),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  isAllDay: z.boolean().optional().default(false),
  eventType: z.enum(EVENT_TYPES),
  visibility: z.enum(VISIBILITIES).optional().default('MODULE_ONLY'),
  recurrenceRule: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
})

const participantSchema = z.object({
  userId: z.number().int().positive(),
  role: z.enum(['ORGANIZER', 'ATTENDEE', 'OPTIONAL']).optional().default('ATTENDEE'),
})

export const createEventSchema = eventBase
  .extend({ participants: z.array(participantSchema).optional() })
  .refine((d) => d.endTime > d.startTime, {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  })

// Partial for PATCH/PUT — no participants (handled separately)
export const updateEventSchema = eventBase.partial()

export const eventQuerySchema = z.object({
  sourceModule: z.enum(SOURCE_MODULES).optional(),
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  eventType: z.enum(EVENT_TYPES).optional(),
  visibility: z.enum(VISIBILITIES).optional(),
  limit: z.coerce.number().int().positive().max(1000).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
})

export const permissionSchema = z.object({
  userId: z.number().int().positive(),
  moduleName: z.enum(PERMISSION_MODULES),
  canView: z.boolean().optional().default(true),
  canEdit: z.boolean().optional().default(false),
})

export const bulkPermissionSchema = z.object({
  permissions: z.array(permissionSchema).min(1),
})

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type EventQueryInput = z.infer<typeof eventQuerySchema>
export type PermissionInput = z.infer<typeof permissionSchema>
