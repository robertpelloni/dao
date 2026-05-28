#!/bin/bash
# LiquidGov Build Script
set -e

echo "=== LiquidGov Build Sequence Start ==="

# Cleanup old artifacts
echo "Cleaning up old build artifacts..."
rm -rf dist/
rm -rf frontend/dist/

echo "Building Backend (TypeScript)..."
npm run build:backend

echo "Building Frontend (Vite)..."
if [ -d "frontend" ]; then
    cd frontend
    # Ensure dependencies are present for build
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    npm run build
    cd ..
else
    echo "Warning: frontend directory not found."
fi

echo "=== Build Complete ==="
