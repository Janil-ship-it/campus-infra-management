export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { permissionSchema, bulkPermissionSchema } from '@/lib/validators'
import { getAuthUser, requireAuth, requireAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = requireAuth(await getAuthUser(request))
    requireAdmin(user)

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const moduleName = searchParams.get('moduleName')

    const where: Prisma.UserModulePermissionWhereInput = {}
    if (userId) where.userId = Number(userId)
    if (moduleName) where.moduleName = moduleName

    const permissions = await prisma.userModulePermission.findMany({
      where,
      orderBy: [{ userId: 'asc' }, { moduleName: 'asc' }],
    })

    return NextResponse.json({
      success: true,
      permissions: permissions.map((p) => ({ ...p, id: p.id.toString() })),
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
      if (error.message.startsWith('Forbidden')) return NextResponse.json({ success: false, message: error.message }, { status: 403 })
    }
    console.error('GET /api/permissions error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(await getAuthUser(request))
    requireAdmin(user)

    const body = await request.json()
    const validated = 'permissions' in body
      ? bulkPermissionSchema.parse(body)
      : { permissions: [permissionSchema.parse(body)] }

    const ipAddress = clientIp(request)

    const results = await prisma.$transaction(async (tx) => {
      const out = []
      for (const perm of validated.permissions) {
        const saved = await tx.userModulePermission.upsert({
          where: { userId_moduleName: { userId: perm.userId, moduleName: perm.moduleName } },
          update: { canView: perm.canView, canEdit: perm.canEdit, grantedBy: user.id },
          create: {
            userId: perm.userId,
            moduleName: perm.moduleName,
            canView: perm.canView,
            canEdit: perm.canEdit,
            grantedBy: user.id,
          },
        })

        await tx.auditLog.create({
          data: {
            action: 'PERMISSION_CHANGE',
            userId: user.id,
            ipAddress,
            details: {
              targetUserId: perm.userId,
              moduleName: perm.moduleName,
              canView: perm.canView,
              canEdit: perm.canEdit,
            },
          },
        })

        out.push(saved)
      }
      return out
    })

    return NextResponse.json({
      success: true,
      permissions: results.map((r) => ({ ...r, id: r.id.toString() })),
      message: `Updated ${results.length} permission(s)`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, errors: error.issues }, { status: 400 })
    }
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
      if (error.message.startsWith('Forbidden')) return NextResponse.json({ success: false, message: error.message }, { status: 403 })
    }
    console.error('POST /api/permissions error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}

function clientIp(req: NextRequest) {
  return req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
}
