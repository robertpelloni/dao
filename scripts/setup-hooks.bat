@echo off
set HOOKS_DIR=.git\hooks
if exist %HOOKS_DIR% (
    echo @echo off > %HOOKS_DIR%\pre-push.bat
    echo npm run lint ^&^& npm test ^&^& npm run build >> %HOOKS_DIR%\pre-push.bat
    echo ✓ Hooks installed (simulation for Windows)
)
