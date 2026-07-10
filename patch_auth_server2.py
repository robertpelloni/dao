import re

with open('src/api/server.ts', 'r') as f:
    content = f.read()

# Fix typescript errors
content = re.sub(
    r"const currentPath = req\.originalUrl \? req\.originalUrl\.split\('\?'\)\[0\] : req\.path;\n  if \(skipPaths\.includes\(currentPath\) && req\.method === 'GET'\) return next\(\);\n  if \(publicPostPaths\.includes\(currentPath\) && req\.method === 'POST'\) return next\(\);\n  if \(currentPath === '/auth/login' && req\.method === 'POST'\) return next\(\);",
    r"const currentPath = req.originalUrl ? req.originalUrl.split('?')[0] : req.path;\n  if (currentPath && skipPaths.includes(currentPath) && req.method === 'GET') return next();\n  if (currentPath && publicPostPaths.includes(currentPath) && req.method === 'POST') return next();\n  if (currentPath === '/auth/login' && req.method === 'POST') return next();",
    content
)

with open('src/api/server.ts', 'w') as f:
    f.write(content)
