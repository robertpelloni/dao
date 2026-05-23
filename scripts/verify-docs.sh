#!/bin/bash
# LiquidGov Documentation Standards Verification Script

echo "Verifying documentation standards..."

MANDATORY_FILES=(
    "VISION.md"
    "MEMORY.md"
    "DEPLOY.md"
    "CHANGELOG.md"
    "ROADMAP.md"
    "TODO.md"
    "VERSION.md"
    "IDEAS.md"
    "HANDOFF.md"
    "AGENTS.md"
)

FAILED=0

for FILE in "${MANDATORY_FILES[@]}"; do
    if [ ! -f "$FILE" ]; then
        echo "[!] Missing mandatory file: $FILE"
        FAILED=1
    else
        # Verify minimum content: Must have at least one header or non-empty
        if [ ! -s "$FILE" ]; then
            echo "[!] File is empty: $FILE"
            FAILED=1
        elif [[ "$FILE" != "VERSION.md" ]] && ! grep -q "#" "$FILE"; then
             echo "[!] File lacks structure (no headers): $FILE"
             FAILED=1
        else
            echo "✓ $FILE verified"
        fi
    fi
done

if [ $FAILED -eq 1 ]; then
    echo "Documentation standards verification FAILED."
    exit 1
else
    echo "All documentation standards MET."
    exit 0
fi
