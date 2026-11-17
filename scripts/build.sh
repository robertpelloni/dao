#!/bin/bash
# LiquidGov Build Script
# Strict: a failing backend typecheck/build must fail the whole build.
# (Previously `npm run build:backend || echo ...` swallowed tsc errors and
# reported "Build Complete" over a broken backend.)
set -e

echo "Building Backend..."
npm run build:backend

echo "Building Frontend..."
cd frontend && npm run build
cd ..

echo "Build Complete."
