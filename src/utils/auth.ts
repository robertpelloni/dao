import jwt from 'jsonwebtoken';

// In production, this MUST be set via environment variable.
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-do-not-use-in-production';

export interface TokenPayload {
  userId: string;
}

/**
 * Signs a JWT for a given user ID.
 */
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

/**
 * Verifies a JWT and returns the payload.
 */
export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    throw new Error('Invalid or expired token');
  }
}
