import { SignJWT, jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-replace-before-av5-deployment'
)

export const SESSION_COOKIE = 'gc_session'

export async function signSession(userId: number): Promise<string> {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(SECRET)
}

export async function verifySession(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return typeof payload.uid === 'number' ? payload.uid : null
  } catch {
    return null
  }
}
