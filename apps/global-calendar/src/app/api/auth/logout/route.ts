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
  // Prevent browser from caching the redirect
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
  res.headers.set('Pragma', 'no-cache')
  return res
}

export async function GET(request: Request) {
  return clearSession(NextResponse.redirect(new URL('/login', request.url), 302))
}

export async function POST(request: Request) {
  return clearSession(NextResponse.redirect(new URL('/login', request.url), 303))
}

export async function DELETE() {
  return clearSession(NextResponse.json({ success: true, redirect: '/login' }))
}
