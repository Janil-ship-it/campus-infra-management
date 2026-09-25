import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySession, SESSION_COOKIE } from '@/lib/session'

export interface AuthUser {
  id: number
  email: string
  name: string
  isAdmin: boolean
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null
  const userId = await verifySession(token)
  if (userId === null) return null
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return null
  return { id: user.id, email: user.email, name: user.name, isAdmin: user.isSystemAdmin }
}

export function requireAuth(user: AuthUser | null): AuthUser {
  if (!user) throw new Error('Unauthorized')
  return user
}

export function requireAdmin(user: AuthUser): void {
  if (!user.isAdmin) throw new Error('Forbidden: Admin access required')
}

export async function canAccessModule(
  user: AuthUser,
  moduleName: string,
  level: 'view' | 'edit' = 'view'
): Promise<boolean> {
  if (user.isAdmin) return true
  const perm = await prisma.userModulePermission.findUnique({
    where: { userId_moduleName: { userId: user.id, moduleName } },
  })
  if (!perm) return false
  return level === 'edit' ? perm.canEdit : perm.canView
}

export async function getVisibleModules(user: AuthUser): Promise<string[] | null> {
  if (user.isAdmin) return null
  const perms = await prisma.userModulePermission.findMany({
    where: { userId: user.id, canView: true },
    select: { moduleName: true },
  })
  return perms.map((p) => p.moduleName)
}
