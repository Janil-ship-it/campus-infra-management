import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { verifyPassword } from '@/lib/password'
import { signSession, SESSION_COOKIE } from '@/lib/session'

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })

export async function POST(request: NextRequest) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid request format' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase().trim() },
  })
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 })
  }

  const token = await signSession(user.id)
  const res = NextResponse.json({
    success: true,
    user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isSystemAdmin },
  })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
  return res
}
