import re

with open('tests/proposalGenerator.test.ts', 'r') as f:
    content = f.read()

content = content.replace("amount:       subject: 'Education',", "amount: 10, subject: 'Education',")

with open('tests/proposalGenerator.test.ts', 'w') as f:
    f.write(content)
