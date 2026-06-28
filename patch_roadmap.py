import re

with open('ROADMAP.md', 'r') as f:
    content = f.read()

content = content.replace("## Phase 8: Advanced Automation & Finalization (Active)", "## Phase 8: Advanced Automation & Finalization (Complete)")
content = content.replace("- [ ] AI-driven autonomous proposal generation.", "- [x] AI-driven autonomous proposal generation.")
content = content.replace("- [ ] Cross-chain governance bridge mock.", "- [x] Cross-chain governance bridge mock.")
content = content.replace("- [ ] Advanced security dashboard metrics.", "- [x] Advanced security dashboard metrics.")

content += "\n## Phase 9: Launch & Network Hardening (Active)\n- [ ] Advanced JWT rotation & identity analytics.\n- [ ] External Oracle data integration.\n- [ ] End-to-end load testing.\n"

with open('ROADMAP.md', 'w') as f:
    f.write(content)
