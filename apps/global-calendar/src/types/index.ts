// apps/global-calendar/src/types/index.ts
export interface CalendarEvent {
  id: string
  sourceModule: 'IWD' | 'FINANCE' | 'RND' | 'HMS' | 'ROOM_INFO' | 'ADMIN'
  title: string
  description?: string
  startTime: Date
  endTime: Date
  isAllDay: boolean
  eventType: 'MEETING' | 'TASK' | 'DEADLINE' | 'REMINDER' | 'MILESTONE'
  visibility: 'PUBLIC' | 'MODULE_ONLY' | 'ADMIN_ONLY'
  recurrenceRule?: string
  metadata?: Record<string, unknown>
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED'
  createdBy: number
  createdAt: Date
  updatedAt: Date
  participants?: EventParticipant[]
}

export interface EventParticipant {
  id: string
  eventId: string
  userId: number
  role: 'ORGANIZER' | 'ATTENDEE' | 'OPTIONAL'
  rsvpStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED'
}

export interface UserModulePermission {
  id: string
  userId: number
  moduleName: string
  canView: boolean
  canEdit: boolean
  grantedBy: number
  grantedAt: Date
}

export interface AuditLog {
  id: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'PERMISSION_CHANGE'
  eventId?: string
  userId: number
  ipAddress?: string
  details?: Record<string, unknown>
  timestamp: Date
  event?: {
    title: string
    sourceModule: string
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  errors?: any
  meta?: {
    total?: number
    limit?: number
    offset?: number
    hasMore?: boolean
  }
}