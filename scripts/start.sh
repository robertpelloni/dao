#!/bin/bash
# LiquidGov Start Script

echo "Starting LiquidGov Governance Engine (Backend)..."
npx ts-node src/api/server.ts > server.log 2>&1 &
BACKEND_PID=$!

echo "Starting LiquidGov Dashboard (Frontend)..."
cd frontend && npm run dev > vite.log 2>&1 &
FRONTEND_PID=$!

echo "Both services are starting."
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:5173"
echo "Press Ctrl+C to stop both."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
