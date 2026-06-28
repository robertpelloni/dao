import re

with open('src/api/server.ts', 'r') as f:
    content = f.read()

# Replace authenticateToken logic
content = re.sub(
    r"const skipPaths = \['/api/governance/sybil-report', '/health', '/summary', '/proposals', '/committees', '/users', '/auth/login', '/governance/trends', '/governance/cycles', '/governance/cycle', '/tasks'\];\n  const publicPostPaths = \['/proposals/triage'\];\n\n  if \(skipPaths\.includes\(req\.path\) && req\.method === 'GET'\) return next\(\);\n  if \(publicPostPaths\.includes\(req\.path\) && req\.method === 'POST'\) return next\(\);\n  if \(req\.path === '/auth/login' && req\.method === 'POST'\) return next\(\);",
    r"const skipPaths = ['/api/governance/sybil-report', '/health', '/summary', '/proposals', '/committees', '/users', '/auth/login', '/governance/trends', '/governance/cycles', '/governance/cycle', '/api/governance/trends', '/api/governance/cycles', '/api/governance/cycle', '/tasks'];\n  const publicPostPaths = ['/proposals/triage'];\n\n  const currentPath = req.originalUrl ? req.originalUrl.split('?')[0] : req.path;\n  if (skipPaths.includes(currentPath) && req.method === 'GET') return next();\n  if (publicPostPaths.includes(currentPath) && req.method === 'POST') return next();\n  if (currentPath === '/auth/login' && req.method === 'POST') return next();",
    content
)

with open('src/api/server.ts', 'w') as f:
    f.write(content)
