import re

with open('src/api/server.ts', 'r') as f:
    content = f.read()

# Fix contribute endpoint
content = re.sub(
    r"app\.post\('/proposals/:id/contribute', \(req: Request, res: Response\) => {\s*const { userId, amount } = req\.body;\s*try {\s*crowdfunding\.contribute\(userId, s\(req\.params\.id\), amount\);",
    r"app.post('/proposals/:id/contribute', (req: Request, res: Response) => {\n  const { userId, amount, tokenSymbol } = req.body;\n  try {\n    crowdfunding.contribute(userId, s(req.params.id), amount, tokenSymbol);",
    content
)

with open('src/api/server.ts', 'w') as f:
    f.write(content)
