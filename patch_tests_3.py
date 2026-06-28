import re

with open('tests/proposalGenerator.test.ts', 'r') as f:
    content = f.read()

content = content.replace("store.addGovernanceCycle({", "store['db'].prepare('INSERT INTO governance_cycles (number, status, totalProposals, totalVotesCast, totalFundingAllocated) VALUES (?, ?, ?, ?, ?)').run(")
content = content.replace("number: 1, status: 'ARCHIVED',", "1, 'ARCHIVED',")
content = content.replace("totalProposals: 10,", "10,")
content = content.replace("totalVotes: 100,", "100,")
content = content.replace("totalFunding: 1000,", "1000")
content = content.replace("timestamp: Date.now(),", ")")
content = re.sub(r"\n\s+topSubjects: \[\]", "", content)

with open('tests/proposalGenerator.test.ts', 'w') as f:
    f.write(content)
