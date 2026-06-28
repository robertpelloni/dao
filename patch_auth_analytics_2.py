import re

# Update identity.ts to track authentication analytics
with open('src/core/identity.ts', 'r') as f:
    identity_content = f.read()

analytics_block = """
  // Authentication Analytics
  private authStats = {
    successfulLogins: 0,
    failedLogins: 0,
    tokenRefreshes: 0
  };

  recordLoginSuccess() {
    this.authStats.successfulLogins++;
  }

  recordLoginFailure() {
    this.authStats.failedLogins++;
  }

  recordTokenRefresh() {
    this.authStats.tokenRefreshes++;
  }

  getAuthAnalytics() {
    return { ...this.authStats };
  }
"""

if "private authStats" not in identity_content:
    identity_content = identity_content.replace(
        "verifyHumanity(userId: string, zkProof: string): boolean {",
        analytics_block + "\n  verifyHumanity(userId: string, zkProof: string): boolean {"
    )

with open('src/core/identity.ts', 'w') as f:
    f.write(identity_content)

# Expose endpoint in server.ts
with open('src/api/server.ts', 'r') as f:
    server_content = f.read()

endpoint_block = """
app.get('/api/governance/auth-analytics', (req: Request, res: Response) => {
  res.json(globalIdentity.getAuthAnalytics());
});

app.post('/auth/login',"""

server_content = server_content.replace("app.post('/auth/login',", endpoint_block)
server_content = server_content.replace("'/auth/login', '/auth/refresh',", "'/auth/login', '/auth/refresh', '/api/governance/auth-analytics',")

# Update login/refresh to record stats
server_content = server_content.replace(
    "const token = signToken({ userId });",
    "globalIdentity.recordLoginSuccess();\n  const token = signToken({ userId });"
)
server_content = server_content.replace(
    "res.status(401).json({ error: 'Missing token' });",
    "globalIdentity.recordLoginFailure();\n    return res.status(401).json({ error: 'Missing token' });"
)
server_content = server_content.replace(
    "const newToken = signToken({ userId: payload.userId });",
    "globalIdentity.recordTokenRefresh();\n    const newToken = signToken({ userId: payload.userId });"
)

with open('src/api/server.ts', 'w') as f:
    f.write(server_content)
