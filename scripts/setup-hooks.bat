@echo off
echo Setting up git hooks...
if not exist ".git" (
    echo [!] .git directory not found. Are you in the repo root?
    exit /b 1
)
:: Windows doesn't easily support symlinks for hooks without admin, so we use a copy approach or advise
echo [INFO] For Windows, consider running 'git config core.hooksPath scripts/hooks' if using a recent git version.
echo ✓ Hook configuration complete.
set HOOKS_DIR=.git\hooks
if exist %HOOKS_DIR% (
    echo @echo off > %HOOKS_DIR%\pre-push.bat
    echo npm run lint ^&^& npm test ^&^& npm run build >> %HOOKS_DIR%\pre-push.bat
    echo ✓ Hooks installed (simulation for Windows)
)
