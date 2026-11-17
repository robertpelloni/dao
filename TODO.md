# TODO

Short-term, human-curated. Note: the Executive Protocol's governance sync
(`src/core/protocol/governance.ts`) regenerates this file from a TODO/FIXME
grep — that is why it previously contained only grep noise.

- [ ] Commit 1.1.109 after review (version sync + treasury subject pools + baseline repair).
- [ ] Fix `tests/protocol.integration.test.ts` / `protocol.full.integration.test.ts` on Windows: replace Unix shell idioms (`|| true`) in `src/core/repository.ts` and `src/core/protocol/merger.ts`, and set the temp bare remote HEAD to `main` in the tests.
- [ ] Make `tests/phase10.integration.test.ts` reliable in the full parallel run (isolate its store state).
- [ ] Decide `FAST_TRACKED`: add entry transitions (DRAFT/EMERGENCY → FAST_TRACKED) or remove the status from `ProposalStatus` and docs.
- [ ] Install `@types/supertest` properly in this workspace so `npx tsc --noEmit` is clean including tests (currently resolved from a shared parent `node_modules`).
- [ ] De-duplicate the conflicting Phase 7/8 sections in `ROADMAP.md`.
- [ ] Verify the frontend build (`npm run test:all`) on a clean `frontend/node_modules`.
