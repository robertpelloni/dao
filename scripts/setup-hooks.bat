@echo off
echo Setting up Git Hooks...

if not exist ".git\hooks" mkdir ".git\hooks"
echo npm test > .git\hooks\pre-commit

echo Hooks setup successfully.
