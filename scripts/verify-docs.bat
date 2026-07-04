@echo off
echo Verifying Documentation Standards...

set docs=VISION.md MEMORY.md DEPLOY.md CHANGELOG.md ROADMAP.md TODO.md VERSION.md IDEAS.md HANDOFF.md AGENTS.md
for %%d in (%docs%) do (
    if not exist "%%d" (
        echo Error: Missing mandatory document %%d
    )
)

echo All mandatory documents are present.
