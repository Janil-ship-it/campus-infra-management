# Global Calendar API Contract (v1)

Base: /api  |  Auth: httpOnly cookie gc_session (browser) — service keys in Phase 6
Owner: Global Calendar module. Breaking changes require PR review by owner.

## POST /api/events
Create event. Requires edit permission on sourceModule.
Body: { sourceModule, title, startTime, endTime, eventType,
        visibility?, description?, isAllDay?, recurrenceRule?, metadata?, participants? }
Enums: sourceModule IWD|FINANCE|RND|HMS|ROOM_INFO|ADMIN
       eventType MEETING|TASK|DEADLINE|REMINDER|MILESTONE
       visibility PUBLIC|MODULE_ONLY|ADMIN_ONLY
201 { success, event } | 400 validation | 401 no session | 403 no edit rights

## GET /api/events
Returns only events the session may see (RBAC: PUBLIC + permitted modules;
ADMIN_ONLY hidden from non-admins). Params: sourceModule, eventType,
visibility, startTime, endTime, limit, offset.

## GET|PUT|DELETE /api/events/{id}
DELETE is a soft cancel (status=CANCELLED) — history retained for audit.

## POST /api/auth/login   { email, password } -> sets gc_session cookie
## GET  /api/auth/session -> { user, permissions[] }
## POST /api/auth/logout
## GET  /api/users            (admin) users + permission matrix
## GET  /api/permissions      (admin)
## POST /api/permissions      (admin) { userId, moduleName, canView, canEdit }
## GET  /api/audit-log        (admin) params: action, userId, eventId, startTime, endTime, limit, offset

All writes produce an audit_log row (CREATE/UPDATE/DELETE/PERMISSION_CHANGE).
BigInt ids are serialized as strings in JSON.
