# AGENTS: Universal LLM Instructions & Project Protocol

This file serves as the "Source of Truth" for all AI agents (Claude, Gemini, GPT, Copilot, etc.) working on the LiquidGov (dao) project. Adherence to these protocols is mandatory for "Insanely Great" development.

## 1. Core Operating Principles
- **Resourcefulness:** Use all available tools to solve problems autonomously. Research web documentation if a library is unfamiliar.
- **Verification:** Every code change MUST be verified using read-only tools (`read_file`, `list_files`, `ls`) or by running tests.
- **Source Integrity:** Never edit build artifacts (`dist/`, `node_modules/`). Always trace back to the TypeScript source.
- **Milestone-Driven:** Always work from the `ROADMAP.md` and `TODO.md`. Mark steps complete only after verification.

## 2. Documentation Standards
Every session must result in updated documentation:
- **VERSION.md:** Contains only the `x.y.z` version string.
- **VISION.md:** High-level philosophical and strategic goals.
- **MEMORY.md:** Implementation notes, architectural decisions, and "why" reasoning.
- **CHANGELOG.md:** Detailed history (Added, Changed, Deprecated, Fixed).
- **ROADMAP.md:** Long-term phases and structural milestones.
- **TODO.md:** Short-term tasks and immediate feature implementations.
- **HANDOFF.md:** Status report for the next agent/session.
- **IDEAS.md:** Creative suggestions for future pivots or enhancements.

## 3. Coding & Commenting Standards
- **Extreme Commenting:** Comment what the code does, BUT ALSO why it was done that way, potential side effects, optimizations, and any failed methods attempted.
- **Type Safety:** Maintain strict TypeScript definitions. Prefer interfaces over raw types.
- **Modular Design:** Keep logic decoupled. Core math in `src/core`, data logic in `src/models`, UI in `frontend/src`.

## 4. Versioning & Git Protocol
- **Bump version for EVERY significant change/build.**
- **Synchronize:** Version must be identical in `VERSION.md`, `package.json`, and `CHANGELOG.md`.
- **Commit Messages:** Must start with "Bump version to X.Y.Z:" and summarize the changes.
- **Merges:** Intelligently merge feature branches into `main`. Solve conflicts without losing features or progress.
- **CI Protocol:** All changes are automatically validated by the `LiquidGov Autopilot CI` workflow, which enforces the Executive Sync Protocol and documentation standards.

## 5. Model-Specific Overlays
- **CLAUDE.md:** Focus on detailed architectural reasoning.
- **GEMINI.md:** Focus on edge-case analysis and mathematical verification.
- **GPT.md:** Focus on code generation efficiency and modularity.
- **copilot-instructions.md:** Focus on inline documentation and style consistency.

---
**STRICT INSTRUCTION:** Do NOT `taskkill` node processes. It will terminate the session.
