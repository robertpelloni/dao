import re

with open('src/core/proposalGenerator.ts', 'r') as f:
    content = f.read()

content = content.replace("committeeId: committeeMatch?.id ? committeeMatch.id : 'General-Committee',", "committeeId: (committeeMatch && committeeMatch.id) ? committeeMatch.id : 'General-Committee',")

with open('src/core/proposalGenerator.ts', 'w') as f:
    f.write(content)
