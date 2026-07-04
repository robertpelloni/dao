@echo off
echo Verifying documentation standards...
set mandatory=VISION.md MEMORY.md DEPLOY.md CHANGELOG.md ROADMAP.md TODO.md VERSION.md IDEAS.md HANDOFF.md AGENTS.md PROTOCOL_SPEC.md

for %%f in (%mandatory%) do (
    if not exist "%%f" (
        echo [!] Mandatory file missing: %%f
        exit /b 1
    )
    echo ✓ %%f exists
)
echo ✓ All mandatory documents are present.
