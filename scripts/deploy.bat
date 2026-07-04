@echo off
echo Executing artifact deployment...
if not exist "deploy-artifacts" mkdir deploy-artifacts
xcopy /E /Y /I dist deploy-artifacts\dist
xcopy /E /Y /I frontend\dist deploy-artifacts\frontend\dist
echo Artifacts staged in deploy-artifacts/
