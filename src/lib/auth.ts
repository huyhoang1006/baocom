import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}
const JWT_EXPIRES_IN = '7d'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(userId: string, role: string): string {
  return jwt.sign({ userId, role }, JWT_SECRET!, { algorithm: 'HS256', expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token: string): { userId: string; role: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET!) as { userId: string; role: string; exp?: number }
    return { userId: payload.userId, role: payload.role }
  } catch {
    return null
  }
}
