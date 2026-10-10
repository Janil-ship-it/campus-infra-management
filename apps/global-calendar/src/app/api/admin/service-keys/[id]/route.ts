import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUser, requireAuth, requireAdmin } from '@/lib/auth'

export const dynamic = 'force-dynamic';

type Ctx = { params: { id: string } }

export async function DELETE(request: NextRequest, { params }: Ctx) {
  try {
    const user = requireAuth(await getAuthUser(request))
    requireAdmin(user)

    const id = parseInt(params.id)

    await prisma.serviceKey.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({
      success: true,
      message: 'Service key revoked',
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }
    if (error instanceof Error && error.message.startsWith('Forbidden')) {
      return NextResponse.json({ success: false, message: error.message }, { status: 403 })
    }
    console.error('DELETE /api/admin/service-keys/[id] error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
