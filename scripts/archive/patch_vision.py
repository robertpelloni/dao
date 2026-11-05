import re

with open('VISION.md', 'r') as f:
    content = f.read()

content = content.replace("Phase 1-3:** Core engine, API, and Web Prototype (Completed).", "Phase 1-8:** Core engine, Quadratic Funding, Advanced Identity Analytics, AI Automation, and Web Prototype (Completed).")

with open('VISION.md', 'w') as f:
    f.write(content)
