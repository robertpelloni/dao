@echo off
echo Starting LiquidGov Governance Engine (Backend)...
start /b cmd /c "npx ts-node src/api/server.ts > server.log 2>&1"

echo Starting LiquidGov Dashboard (Frontend)...
cd frontend
start /b cmd /c "npm run dev > vite.log 2>&1"
cd ..

echo Both services are starting.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo Close this window to stop both.
