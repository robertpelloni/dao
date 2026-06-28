import re

with open('tests/proposalGenerator.test.ts', 'r') as f:
    content = f.read()

content = content.replace("totalProposals, totalVotesCast, totalFundingAllocated) VALUES (?, ?, ?, ?, ?)", "totalVotesCast, totalFundingAllocated) VALUES (?, ?, ?, ?)")
content = content.replace("10,\n", "")

with open('tests/proposalGenerator.test.ts', 'w') as f:
    f.write(content)
