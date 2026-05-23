import { signToken, verifyToken } from '../src/utils/auth';

describe('Auth Utilities', () => {
  it('should sign and verify a token', () => {
    const payload = { userId: 'alice' };
    const token = signToken(payload);
    expect(token).toBeDefined();

    const verified = verifyToken(token);
    expect(verified.userId).toBe('alice');
  });

  it('should throw error for invalid token', () => {
    expect(() => verifyToken('invalid-token')).toThrow('Invalid or expired token');
  });
});
