@echo off
echo Building Backend...
npm run build:backend
echo Building Frontend...
cd frontend
call npm run build
cd ..
echo Build Complete.
