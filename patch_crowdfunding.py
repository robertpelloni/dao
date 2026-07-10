import re

with open('src/core/crowdfunding.ts', 'r') as f:
    content = f.read()

# Fix contribute function signature
content = re.sub(
    r"contribute\(userId: string, proposalId: string, amount: number\): void {",
    r"contribute(userId: string, proposalId: string, amount: number, tokenSymbol?: string): void {",
    content
)

content = re.sub(
    r"tokenSymbol: proposal\.tokenSymbol \|\| 'USD',",
    r"tokenSymbol: tokenSymbol || proposal.tokenSymbol || 'USD',",
    content
)

with open('src/core/crowdfunding.ts', 'w') as f:
    f.write(content)
