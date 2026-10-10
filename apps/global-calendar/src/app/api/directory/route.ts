import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const contacts = await prisma.ficContact.findMany({
      include: {
        functionalCategory: true,
        parentContact: { select: { officialTitle: true, primaryEmail: true } },
        secondaryContacts: { select: { officialTitle: true, primaryEmail: true } },
      },
      orderBy: [
        { functionalCategoryId: 'asc' },
        { systemRole: 'asc' },
        { officialTitle: 'asc' }
      ]
    })
    return NextResponse.json({ success: true, data: contacts })
  } catch (error) {
    console.error('Directory fetch error:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch directory' }, { status: 500 })
  }
}
