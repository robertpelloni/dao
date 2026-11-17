@echo off
REM LiquidGov Build Script (Windows parity with build.sh)
REM Strict: propagate failures instead of always printing "Build Complete".
echo Building Backend...
call npm run build:backend
if errorlevel 1 (echo Backend build FAILED. & exit /b 1)
echo Building Frontend...
cd frontend
call npm run build
if errorlevel 1 (echo Frontend build FAILED. & exit /b 1)
cd ..
echo Build Complete.
