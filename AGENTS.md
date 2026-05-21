# AGENTS Instructions

This file contains universal instructions for all LLM agents working on this project.

## General Principles
- **Verify Your Work:** Always use read-only tools to confirm changes.
- **Edit Source, Not Artifacts:** Trace build artifacts back to their source files.
- **Proactive Testing:** Write and run tests for every change.
- **Autonomous Progress:** Proceed through the roadmap and TODO list independently when possible.
- **Detailed Documentation:** Comment code extensively and keep all documentation files updated.

## Versioning & Changelog
- Every build/significant change should have a new version number.
- The version number is stored in `VERSION.md`.
- Synchronize `VERSION.md` with `CHANGELOG.md`.
- Mention the version number bump in git commit messages.

## File Standards
- `VISION.md`: Describes the ultimate goal and design.
- `ROADMAP.md`: Major long-term structural plans.
- `TODO.md`: Individual features, bug fixes, and short-term tasks.
- `CHANGELOG.md`: Detailed history of changes.
- `MEMORY.md`: Ongoing observations about the codebase and design preferences.
- `DEPLOY.md`: Latest detailed deployment instructions.
- `HANDOFF.md`: Detailed analysis and status for the next session/model.

## Coding Style
- Comment your code in depth: what, why, side effects, optimizations, etc.
- Use subagents if possible to implement features.
- Commit/push to git between each major step.
