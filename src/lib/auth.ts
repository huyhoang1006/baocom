import bcrypt from 'bcryptjs'
import * as jose from 'jose'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}
const JWT_EXPIRES_IN = '7d'

const secret = new TextEncoder().encode(JWT_SECRET)

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function signToken(userId: string, role: string, tokenVersion: number): Promise<string> {
  return new jose.SignJWT({ userId, role, tokenVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<{ userId: string; role: string; tokenVersion: number } | null> {
  try {
    const { payload } = await jose.compactVerify(token, secret)
    const decoded = jose.decodeJwt(token)
    return {
      userId: decoded.userId as string,
      role: decoded.role as string,
      tokenVersion: decoded.tokenVersion as number
    }
  } catch {
    return null
  }
}
