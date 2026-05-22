#!/bin/bash
set -e

echo "=== LiquidGov EXECUTIVE PROTOCOL: Sync & Merge Start ==="

# Set git identity for merges
git config --global user.email "autopilot@liquidgov.org"
git config --global user.name "LiquidGov Autopilot"
git config --global init.defaultBranch main

# 1. Fetch All
echo "[1/4] Fetching all remotes..."
git fetch --all --tags

# 2. Submodule Cleanup
echo "[2/4] Updating submodules recursively..."
git submodule update --init --recursive

# 3. Intelligent Branch Merging (Forward)
echo "[3/4] Checking for feature branches to merge..."
# Find all remote branches that match the AI tool pattern
REMOTE_BRANCHES=$(git branch -r | grep -E 'origin/jules-|origin/main-[0-9]+' || true)

for branch in $REMOTE_BRANCHES; do
  CLEAN_BRANCH=$(echo $branch | sed 's/origin\///')
  echo "Interrogating branch: $CLEAN_BRANCH"

  # Ensure local main exists for comparison
  git checkout main || git checkout -b main origin/main || true

  # Merge branch into main if it has unique commits
  if git rev-parse --verify main >/dev/null 2>&1; then
    if ! git merge-base --is-ancestor $branch main; then
      echo "Merging $CLEAN_BRANCH into main..."
      git merge $branch --no-edit --allow-unrelated-histories || {
        echo "Conflict detected in $CLEAN_BRANCH. Skipping automated merge."
        git merge --abort || true
      }
    else
      echo "Branch $CLEAN_BRANCH is already merged into main."
    fi

    # Reverse Merge (Main back to Features)
    # For active feature branches, merge main back into them
    echo "Reverse merging main into $CLEAN_BRANCH..."
    git checkout $CLEAN_BRANCH || git checkout -b $CLEAN_BRANCH $branch
    git merge main --no-edit || {
      echo "Conflict detected during reverse merge into $CLEAN_BRANCH. Skipping."
      git merge --abort || true
    }
    git push origin $CLEAN_BRANCH || echo "Failed to push updated feature branch $CLEAN_BRANCH"
    git checkout main
  else
    echo "Warning: main branch not found. Skipping merge logic for $CLEAN_BRANCH."
  fi
done

# Push changes if any merges happened
if [ -n "$REMOTE_BRANCHES" ]; then
  echo "Incrementing version for merged changes..."
  CURRENT_VERSION=$(cat VERSION.md)
  IFS='.' read -r major minor patch <<< "$CURRENT_VERSION"
  NEW_VERSION="$major.$minor.$((patch + 1))"

  echo "$NEW_VERSION" > VERSION.md
  sed -i "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json

  echo "Updating CHANGELOG.md..."
  DATE=$(date +%Y-%m-%d)
  sed -i "/## \[Unreleased\]/a \\\n## [$NEW_VERSION] - $DATE\n### Added\n- Automated merge and protocol sync." CHANGELOG.md

  git add VERSION.md package.json CHANGELOG.md
  git commit -m "Bump version to $NEW_VERSION: Automated Protocol Sync [skip ci]"

  # Documentation Sync
  echo "Syncing ROADMAP.md and TODO.md..."
  echo "- [x] Released version $NEW_VERSION" >> ROADMAP.md
  echo "- [x] Integrated $NEW_VERSION updates" >> TODO.md

  # Handoff Generation
  echo "Generating session summary in HANDOFF.md..."
  echo -e "\n### Automated Sync ($NEW_VERSION) - $(date)\n- Merged feature branches: $REMOTE_BRANCHES" >> HANDOFF.md

  git add ROADMAP.md TODO.md HANDOFF.md
  git commit --amend --no-edit

  echo "Pushing merged changes to main..."
  git push origin main || echo "Nothing to push or push failed"
fi

# 4. Version and Documentation Verification
echo "[4/4] Verifying version and documentation synchronization..."
VERSION=$(cat VERSION.md)
PKG_VERSION=$(node -p "require('./package.json').version")

if [ "$VERSION" != "$PKG_VERSION" ]; then
  echo "Error: VERSION.md ($VERSION) does not match package.json ($PKG_VERSION)"
  exit 1
fi

echo "=== Protocol Sync Complete ==="
