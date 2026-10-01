import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'
import { SESSION_COOKIE } from '@/lib/session'

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) {
    const res = NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    if (request.cookies.get(SESSION_COOKIE)?.value) {
      res.cookies.set(SESSION_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
    }
    return res
  }

  const perms = await prisma.userModulePermission.findMany({
    where: { userId: user.id },
    select: { moduleName: true, canView: true, canEdit: true },
  })

  return NextResponse.json({ success: true, user, permissions: perms })
}
