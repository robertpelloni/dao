# TODO

Short-term, human-curated. Note: the Executive Protocol's governance sync
(`archive/protocol-bot/src/core/protocol/governance.ts`, archived) could regenerate this file from a TODO/FIXME
grep — that is why it previously contained only grep noise.

- [x] Build the frontend (`cd frontend; npm install; npm run build`) — done and verified 2026-11-19 (build passes; was broken by a missing `src/vite-env.d.ts` and the dead `components/archive/SystemGovernance.tsx`).
- [ ] Browser-test the dashboard against a seeded backend — backend smoke-tested 2026-11-19 (built server seeds demo users, login + authenticated API work, unauthenticated = 401); a real browser pass against the dashboard UI is still open.
- [x] Decide the unmounted routers: treasury router mounted on the shared instance; governance router archived to `src/api/routes/archive/` (1.1.113).
- [x] Make `tests/phase10.integration.test.ts` deterministic: pinned jury quorum in the test (1.1.113).
- [x] Clean local `npm install` at repo root + `npx tsc --noEmit` (including tests) at zero errors — done and verified 2026-11-19. The install itself was the blocker, not `@types/supertest`: Semaphore proof v3 vs group/identity v4 peer conflict, and `better-sqlite3` misfiled as a devDependency. Jest is 86/86 across three consecutive runs (test store is in-memory now; the shared `dao.db` file was the flake).
- [ ] Consider a real OS tray icon (systray/Electron) only if the CLI controller in `scripts/tray.ts` proves insufficient — do not add the dependency speculatively.
- [ ] Confirm whether external muse.ai/Gemini/ChatGPT coordination via Edge CDP 9222 is wanted; no such channel is configured in this workspace.
- [ ] Pick the next Phase 10 feature from `ROADMAP.md` deliberately (mobile/biometric ZKP, cross-chain routing, VRF juries, ZKP circuit optimization, oracles, PWA deployment).
