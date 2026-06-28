import re

with open('src/core/proposalGenerator.ts', 'r') as f:
    content = f.read()

content = content.replace("targetSubject,", "targetSubject || 'General',")

with open('src/core/proposalGenerator.ts', 'w') as f:
    f.write(content)
