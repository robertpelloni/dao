import re

with open('tests/auth.test.ts', 'r') as f:
    content = f.read()

content = content.replace("Invalid or expired token", "Invalid token")

with open('tests/auth.test.ts', 'w') as f:
    f.write(content)
