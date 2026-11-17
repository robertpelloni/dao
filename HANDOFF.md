# HANDOFF: 2026-11-17

## Current State
- Version: 1.1.112 (`VERSION.md`, `package.json`, `CHANGELOG.md` synchronized)
- Branch: `main` — see `git log --oneline -6` (1.1.109 → 1.1.112, all pushed this session; 1.1.111/d1ad540 was pushed by the watchdog incident below, since gated)
- Backend Jest: **30/30 suites, 90/90 tests** (baseline at session start was 8/29 suites). `npm run build:backend` clean (`tsconfig.build.json`, src-only emit to `dist/`).
- Frontend: **not built this session** — `npm install` in `frontend/` fails in this environment with registry `ERR_SSL_TLSV1_ALERT_PROTOCOL_VERSION` (see npm-cache logs 2026-11-17T06:33Z), leaving hollow `node_modules`. The only frontend code change is a one-line URL fix in `HealthDashboard.tsx`, so risk is low but unverified by a build. Run `cd frontend; npm install; npm run build` where registry access works.

## What this session did (1.1.109–1.1.112)
- Repaired the red baseline: `EffectivePower` object comparison in the vote endpoint; treasury subject pools + `reallocate()`; `FAST_TRACKED` transitions (`EMERGENCY → FAST_TRACKED → FUNDED|REJECTED`); version sync.
- Fixed the Executive Protocol on Windows: `cmd.exe` keeps quotes in `echo "no"`, so `merge-base --is-ancestor ... || echo "no"` always reported "already merged" and forward merges never ran. All `|| echo`/`|| true` idioms in `repository.ts`/`merger.ts` are now exit-code probes. Both protocol integration suites pass.
- Wired the dashboard to the backend: 7 missing endpoints added + tested (`tests/dashboardApi.test.ts`), double-`/api` cycle-transition fixed, first-run demo seed added (fresh server previously 404'd the hardcoded `alice` dashboard).
- Restored `scripts/tray.ts` (CLI daemon controller, BelowNormal priority, quit stops the server). It is **not** an OS tray-icon application — no systray dependency exists.
- Gated the Autonomous Watchdog (below), strict build scripts, archived orphaned `SystemGovernance.tsx` to `frontend/src/components/archive/`, deduplicated `ROADMAP.md`.

## ⚠ Watchdog incident (fixed, but know it happened)
Starting the API server fired `globalWatchdog.start()` → immediate tick → `TaskManager.executeTask` → full Executive Protocol against the **real repo**: reconcile, version bump, `git commit`, `git push`. That is how `d1ad540` (v1.1.111) got pushed during testing, sweeping up the then-staged `scripts/tray.ts` and `package.json`. The watchdog is now opt-in (`LIQUIDGOV_ENABLE_WATCHDOG=true`, default off, logged). **Still true:** clicking Execute on a task in the dashboard TaskMonitor runs the same protocol against the real repo by design — treat that button as armed.

## Known issues / next steps
1. Frontend build unverified (registry TLS in this environment) — install + build elsewhere, then exercise the dashboard in a browser.
2. `phase10.integration.test.ts` passed in the last full run but has flaked under parallel full runs before (shared store state suspected).
3. `npx tsc --noEmit` (full, incl. tests) still reports 2 missing-`@types/supertest` errors in this environment's shared `node_modules`; Jest transpiles and passes regardless. A clean local `npm install` should resolve it.
4. Duplicate governance surface: `src/api/routes/governance.ts`/`treasury.ts` routers vs inline routes in `server.ts` — the routers appear unmounted; consolidate or delete after checking mounts.
5. MCP/Edge-CDP coordination asked for in the session directive was not performed: no muse.ai/Gemini/ChatGPT coordination channel is configured in this workspace, and Edge CDP 9222 was not verified live. Owner to confirm if that external coordination is still wanted.
6. `ROADMAP.md` Phase 10 is the only open phase. Pick the next feature from there deliberately rather than another consolidation cycle.

## Runbook
```powershell
npm run build:backend            # tsc -p tsconfig.build.json -> dist/
npx ts-node scripts/tray.ts start   # daemon (BelowNormal), pidfile .daemon.pid, log daemon.log
curl http://localhost:3000/health   # {"status":"OK","version":"1.1.112"}
npx ts-node scripts/tray.ts quit    # stops the daemon (verified)
npm test                            # jest, 30 suites
cd frontend; npm install; npm run dev  # dashboard on :5173 (proxy /api -> :3000)
```
