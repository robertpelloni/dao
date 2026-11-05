import re

with open('tests/proposalGenerator.test.ts', 'r') as f:
    content = f.read()

content = content.replace("store.addHistoricalTrend({", "store['historicalTrends'].push({")

with open('tests/proposalGenerator.test.ts', 'w') as f:
    f.write(content)
