import re

with open('ROADMAP.md', 'r') as f:
    content = f.read()

content = content.replace("## Phase 7: Infrastructure & Scalability (Active)", "## Phase 7: Infrastructure & Scalability (Complete)")
content = content + "\n## Phase 8: Advanced Automation & Finalization (Active)\n- [ ] AI-driven autonomous proposal generation.\n- [ ] Cross-chain governance bridge mock.\n- [ ] Advanced security dashboard metrics.\n"

with open('ROADMAP.md', 'w') as f:
    f.write(content)
