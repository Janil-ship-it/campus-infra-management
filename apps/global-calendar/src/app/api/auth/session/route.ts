export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request)
  if (!user) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

  const perms = await prisma.userModulePermission.findMany({
    where: { userId: user.id },
    select: { moduleName: true, canView: true, canEdit: true },
  })

  return NextResponse.json({ success: true, user, permissions: perms })
}
