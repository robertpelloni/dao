#!/bin/bash
# LiquidGov Build Script

echo "Building Backend..."
npm run build:backend || echo "No backend build step defined (using ts-node for runtime)."

echo "Building Frontend..."
cd frontend && npm run build
cd ..

echo "Build Complete."
