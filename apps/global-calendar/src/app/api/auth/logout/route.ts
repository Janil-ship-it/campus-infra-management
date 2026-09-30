import { NextResponse } from 'next/server'

function clearSession(res: NextResponse) {
  res.cookies.set('gc_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  })
  return res
}

export async function GET(request: Request) {
  return clearSession(NextResponse.redirect(new URL('/login', request.url), 302))
}

export async function POST() {
  return clearSession(NextResponse.json({ success: true, redirect: '/login' }))
}

export async function DELETE() {
  return clearSession(NextResponse.json({ success: true, redirect: '/login' }))
}
