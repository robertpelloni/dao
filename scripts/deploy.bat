@echo off
echo Starting Deployment...

rem Build backend
call npm run build:backend

rem Build frontend
cd frontend
call npm run build
cd ..

rem Move artifacts
if not exist "deploy-artifacts" mkdir "deploy-artifacts"
xcopy /E /I /Y dist\* deploy-artifacts\backend\dist\
xcopy /E /I /Y frontend\dist\* deploy-artifacts\frontend\

echo Deployment artifacts staged successfully.
