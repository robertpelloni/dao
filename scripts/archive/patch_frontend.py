import re

# Update useDashboard.ts
with open('frontend/src/hooks/useDashboard.ts', 'r') as f:
    content = f.read()

content = re.sub(
    r"api\.get\('/governance/cycle'\)",
    r"api.get('/api/governance/cycle')",
    content
)

with open('frontend/src/hooks/useDashboard.ts', 'w') as f:
    f.write(content)

# Update CycleTrends.tsx
with open('frontend/src/components/CycleTrends.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r"'http://localhost:3000/governance/trends'",
    r"'http://localhost:3000/api/governance/trends'",
    content
)

with open('frontend/src/components/CycleTrends.tsx', 'w') as f:
    f.write(content)
