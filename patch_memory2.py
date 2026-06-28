with open('MEMORY.md', 'r') as f:
    content = f.read()

content += "\n## Milestone Oracle Documentation\n- The Milestone Oracle handles consensus regarding whether funds should be released. A randomly selected jury is generated and must vote to approve releasing funds for a given proposal milestone. This documentation was incomplete but has now been clarified. It requires users to be verified before they can be added to a jury.\n"

with open('MEMORY.md', 'w') as f:
    f.write(content)
