import re

with open('src/utils/auth.ts', 'r') as f:
    content = f.read()

new_content = """import jwt from 'jsonwebtoken';

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
"""

with open('src/utils/auth.ts', 'w') as f:
    f.write(new_content)

# Update server.ts
with open('src/api/server.ts', 'r') as f:
    server_content = f.read()

server_content = server_content.replace(
    "import { signToken, verifyToken } from '../utils/auth';",
    "import { signToken, signRefreshToken, verifyToken, verifyRefreshToken } from '../utils/auth';"
)

login_block = """app.post('/auth/login', (req: Request, res: Response) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  // In a real app, verify password/signature here.
  const token = signToken({ userId });
  const refreshToken = signRefreshToken({ userId });
  res.json({ token, refreshToken });
});

app.post('/auth/refresh', (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: 'refreshToken is required' });

  try {
    const payload = verifyRefreshToken(refreshToken);
    const newToken = signToken({ userId: payload.userId });
    const newRefreshToken = signRefreshToken({ userId: payload.userId }); // Optional: rotate refresh token
    res.json({ token: newToken, refreshToken: newRefreshToken });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
});
"""

server_content = re.sub(
    r"app\.post\('/auth/login', \(req: Request, res: Response\) => \{[\s\S]*?res\.json\(\{ token \}\);\n\}\);",
    login_block,
    server_content
)

server_content = server_content.replace("'/auth/login',", "'/auth/login', '/auth/refresh',")

with open('src/api/server.ts', 'w') as f:
    f.write(server_content)
