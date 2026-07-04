import jwt from 'jsonwebtoken';

// In production, this MUST be set via environment variable.
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-do-not-use-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-do-not-use-in-production';

export interface TokenPayload {
  userId: string;
  role?: string;
}

/**
 * Signs an access JWT for a given user ID.
 */
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' }); // Short-lived access token
}

/**
 * Signs a refresh JWT for a given user ID.
 */
export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' }); // Long-lived refresh token
}

/**
 * Verifies an access JWT and returns the payload.
 */
export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (err: any) {
    throw new Error(err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token');
  }
}

/**
 * Verifies a refresh JWT and returns the payload.
 */
export function verifyRefreshToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
  } catch (err: any) {
    throw new Error(err.name === 'TokenExpiredError' ? 'Refresh token expired' : 'Invalid refresh token');
  }
}
