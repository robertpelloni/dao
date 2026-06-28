import re

with open('tests/proposalGenerator.test.ts', 'r') as f:
    content = f.read()

content = content.replace("store['historicalTrends'].push({", "store.addGovernanceCycle({")
content = content.replace("cycleId: 1,", "number: 1, status: 'ARCHIVED',")
content = content.replace("topSubjects: []", "")

with open('tests/proposalGenerator.test.ts', 'w') as f:
    f.write(content)
