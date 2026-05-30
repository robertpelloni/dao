#!/bin/bash
HOOKS_DIR=".git/hooks"
if [ -d "$HOOKS_DIR" ]; then
    echo "#!/bin/bash
    npm run lint && npm test && npm run build" > "$HOOKS_DIR/pre-push"
    chmod +x "$HOOKS_DIR/pre-push"
fi
