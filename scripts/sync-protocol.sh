#!/bin/bash
set -e

echo "=== LiquidGov EXECUTIVE PROTOCOL: Sync & Merge Start ==="

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

  # Merge branch into main if it has unique commits
  if ! git merge-base --is-ancestor $branch main; then
    echo "Merging $CLEAN_BRANCH into main..."
    git merge $branch --no-edit --allow-unrelated-histories || {
      echo "Conflict detected in $CLEAN_BRANCH. Skipping automated merge."
      git merge --abort
    }
  else
    echo "Branch $CLEAN_BRANCH is already merged."
  fi

  # Reverse Merge (Main back to Features)
  # For active feature branches, merge main back into them
  echo "Reverse merging main into $CLEAN_BRANCH..."
  git checkout $CLEAN_BRANCH || git checkout -b $CLEAN_BRANCH $branch
  git merge main --no-edit || {
    echo "Conflict detected during reverse merge into $CLEAN_BRANCH. Skipping."
    git merge --abort
  }
  git checkout main
done

# 4. Version and Documentation Verification
echo "[4/4] Verifying version and documentation synchronization..."
VERSION=$(cat VERSION.md)
PKG_VERSION=$(node -p "require('./package.json').version")

if [ "$VERSION" != "$PKG_VERSION" ]; then
  echo "Error: VERSION.md ($VERSION) does not match package.json ($PKG_VERSION)"
  exit 1
fi

echo "=== Protocol Sync Complete ==="
