import re

with open('frontend/src/components/HealthDashboard.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r"api\.post\('/governance/transition-cycle'\)",
    r"api.post('/api/governance/transition-cycle')",
    content
)

with open('frontend/src/components/HealthDashboard.tsx', 'w') as f:
    f.write(content)
