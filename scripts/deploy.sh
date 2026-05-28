#!/bin/bash
# LiquidGov Automated Deployment Script
set -e

echo "=== LiquidGov Deployment Engine Start ==="

# 1. Environment Validation
echo "[1/4] Validating environment..."
if [ ! -f "VERSION.md" ]; then
    echo "Error: VERSION.md missing."
    exit 1
fi
VERSION=$(cat VERSION.md)
echo "Deploying version: $VERSION"

# 2. Artifact Verification
echo "[2/4] Verifying build artifacts..."
if [ ! -d "dist" ]; then
    echo "Error: Backend artifacts (dist/) not found. Running build..."
    bash scripts/build.sh
fi

if [ ! -d "frontend/dist" ]; then
    echo "Error: Frontend artifacts (frontend/dist/) not found."
    exit 1
fi

# 3. Packaging
echo "[3/4] Preparing deployment package..."
DEPLOY_DIR="deploy-artifacts"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR/backend"
mkdir -p "$DEPLOY_DIR/frontend"

cp -r dist/* "$DEPLOY_DIR/backend/"
cp -r frontend/dist/* "$DEPLOY_DIR/frontend/"
cp package.json "$DEPLOY_DIR/"
cp VERSION.md "$DEPLOY_DIR/"

# 4. Simulated Delivery
# In production, this would use rsync, docker push, or AWS CLI
echo "[4/4] Delivering artifacts to target environment..."
# Example: rsync -avz "$DEPLOY_DIR/" user@remote-host:/var/www/liquidgov/
echo "Artifacts successfully staged in $DEPLOY_DIR/"

# Final Health Check Simulation
echo "Performing post-deployment health check..."
# In CI, we use the docker-verify job, but here we can check local consistency
if [ -f "$DEPLOY_DIR/backend/api/server.js" ]; then
    echo "✓ Backend entry point exists."
else
    echo "× Backend entry point missing in deployment package!"
    exit 1
fi

echo "=== Deployment Complete (v$VERSION) ==="
