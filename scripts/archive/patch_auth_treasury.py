import re

with open('src/api/server.ts', 'r') as f:
    content = f.read()

# Fix the treasuryManager issue
content = re.sub(
    r"const treasuryManager = new TreasuryManager\(globalStore\);\napp\.use\('/api/treasury', authenticateToken, createTreasuryRouter\(treasuryManager\)\);",
    r"app.use('/api/treasury', authenticateToken, createTreasuryRouter(crowdfunding.getTreasury()));",
    content
)

with open('src/api/server.ts', 'w') as f:
    f.write(content)
