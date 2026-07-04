import re

with open('src/api/routes/governance.ts', 'r') as f:
    content = f.read()

# Add governance cycle initialization logic back
if 'globalGovernance.initialize()' not in content:
    content = re.sub(
        r"res\.json\(globalStore\.getCurrentCycle\(\)\);",
        r"let cycle = globalStore.getCurrentCycle();\n    if (!cycle) { cycle = globalGovernance.initialize(); }\n    res.json(cycle);",
        content
    )

with open('src/api/routes/governance.ts', 'w') as f:
    f.write(content)
