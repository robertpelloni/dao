# HANDOFF: 2026-11-17

## Current State
- Version: 1.1.109 (synchronized in `VERSION.md`, `package.json`, `CHANGELOG.md` — previously 1.1.108/1.0.11, 1.0.13, and 1.0.11 respectively)
- Branch: `main` at `3a5f1e4` (docs: revise README), working tree has the uncommitted 1.1.109 changes below — not committed, awaiting owner review.
- Status: Proof-of-concept. Backend Jest 26/29 suites (82/85 tests) passing; `tsc --noEmit` clean for `src/`.

## What changed in 1.1.109 (uncommitted)
- `src/core/treasury.ts`: subject-specific matching pools + `reallocate()` (see CHANGELOG). Callers in `governanceCycle.ts` (committee sunset) and `proposalStateMachine.ts` (`REALLOCATE_FUNDS`) previously called a `TreasuryManager.reallocate` that did not exist.
- `src/api/server.ts`: vote endpoint now compares `power.total` (EffectivePower object, since 1.1.4).
- `src/core/proposalStateMachine.ts`: added unreachable-but-declared `FAST_TRACKED` transitions.
- `src/core/proposalGenerator.ts`: `subjects[0] ?? 'General'` for `noUncheckedIndexedAccess`.
- `tests/treasury.test.ts`: new subject-pool/reallocate test.
- Docs: `VERSION.md` (was two lines), `package.json`, `CHANGELOG.md` synchronized; this file and `TODO.md` rewritten from stale June autopilot output.

## Verified this session
- Baseline before fixes: `tsc` 8 errors; Jest 8/29 suites, 20/22 tests.
- After fixes: `tsc` clean except 2 test-file errors for missing `@types/supertest` in this environment's shared `node_modules` (Jest itself transpiles and those suites pass). Installed the missing `better-sqlite3` prebuilt binary into `node_modules` (gitignored, no repo change) — without it every Store-backed suite fails to load.
- Full Jest after fixes: 26/29 suites, 82/85 tests.

## Known pre-existing issues (not regressions — verified failing on untouched base via `git stash`)
- `tests/protocol.integration.test.ts` and `tests/protocol.full.integration.test.ts`: feature branch never lands on `main`. Lead hypothesis: the Executive Protocol shells out with Unix idioms (`|| true`, `|| echo ""`) that fail under Windows `cmd.exe`; the temp bare remote also defaults its HEAD to `master` while the test pushes `main`. Needs a Windows-parity pass on `src/core/repository.ts` / `src/core/protocol/merger.ts` before this automation is trusted.
- `tests/phase10.integration.test.ts`: passes standalone, flaky in the full parallel run (likely shared on-disk store state between suites).
- `FAST_TRACKED` is declared in `ProposalStatus` and `docs/production-v1.md` but no code enters it; the live fast-track path is `EMERGENCY`. Owner decision: wire it up or remove it.
- `ROADMAP.md` contains duplicated, conflicting Phase 7/8 sections; Phases 1–9 are all marked Complete while Phase 10 items remain open.

## Next steps (in advised order)
1. Review and commit 1.1.109 (`Bump version to 1.1.109: ...` per AGENTS.md).
2. Fix the protocol integration tests on Windows (shell parity + bare-remote HEAD), then re-run the full suite.
3. Decide `FAST_TRACKED`: implement entry transitions or drop the status.
4. De-duplicate `ROADMAP.md` Phase 7/8.
