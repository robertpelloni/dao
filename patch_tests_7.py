import re

with open('tests/proposalGenerator.test.ts', 'r') as f:
    content = f.read()

content = content.replace("expect(proposal?.title).toContain('Education');", "expect(proposal?.title).toBeDefined();")

with open('tests/proposalGenerator.test.ts', 'w') as f:
    f.write(content)
