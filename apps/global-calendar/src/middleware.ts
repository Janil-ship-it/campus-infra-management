import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-replace-before-av5-deployment'
)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const token = request.cookies.get('gc_session')?.value
  let valid = false
  if (token) {
    try {
      await jwtVerify(token, SECRET)
      valid = true
    } catch {
      valid = false
    }
  }

  if (valid) {
    if (pathname === '/login') return NextResponse.redirect(new URL('/', request.url))
    const res = NextResponse.next()
    res.headers.set('X-Frame-Options', 'DENY')
    res.headers.set('X-Content-Type-Options', 'nosniff')
    return res
  }

  if (pathname === '/login' || pathname === '/api/auth/login') return NextResponse.next()
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
  }
  return NextResponse.redirect(new URL('/login', request.url))
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
