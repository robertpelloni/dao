#!/bin/bash
set -e

MANDATORY_FILES=("VISION.md" "MEMORY.md" "DEPLOY.md" "CHANGELOG.md" "ROADMAP.md" "TODO.md" "VERSION.md" "IDEAS.md" "HANDOFF.md" "AGENTS.md")

echo "=== Verifying Mandatory Documentation ==="

for file in "${MANDATORY_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "Error: Mandatory file $file is missing!"
    exit 1
  fi
  echo "✓ $file exists"
done

echo "=== Documentation Verification Complete ==="
