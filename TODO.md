# TODO

Short-term, human-curated. Note: the Executive Protocol's governance sync
(`src/core/protocol/governance.ts`) can regenerate this file from a TODO/FIXME
grep — that is why it previously contained only grep noise.

- [ ] Build the frontend where npm registry access works (`cd frontend; npm install; npm run build`), then browser-test the dashboard against a seeded backend (`npm run build:backend; npx ts-node scripts/tray.ts start`).
- [x] Decide the unmounted routers: treasury router mounted on the shared instance; governance router archived to `src/api/routes/archive/` (1.1.113).
- [x] Make `tests/phase10.integration.test.ts` deterministic: pinned jury quorum in the test (1.1.113).
- [ ] Get a clean local `npm install` at repo root so `npx tsc --noEmit` (including tests) reports zero errors (`@types/supertest`).
- [ ] Consider a real OS tray icon (systray/Electron) only if the CLI controller in `scripts/tray.ts` proves insufficient — do not add the dependency speculatively.
- [ ] Confirm whether external muse.ai/Gemini/ChatGPT coordination via Edge CDP 9222 is wanted; no such channel is configured in this workspace.
- [ ] Pick the next Phase 10 feature from `ROADMAP.md` deliberately (mobile/biometric ZKP, cross-chain routing, VRF juries, ZKP circuit optimization, oracles, PWA deployment).
