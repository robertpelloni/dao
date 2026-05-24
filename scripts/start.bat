@echo off
echo Starting LiquidGov Services...
start /b cmd /c "npm run build:backend && node src/api/server.js"
cd frontend
start /b cmd /c "npm run dev"
cd ..
echo Services started in background.
