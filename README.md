# dao — "LiquidGov"

A proof-of-concept for a distributed, voluntary governance platform:
people form topic committees, draft structured proposals, vote with
quadratic voting, and crowdfund the work with assurance-style escrow
and milestone releases. Design-first, with a real TypeScript codebase
underneath the design docs.

**Ground truth (verified 2026-11-19):** this is a working local
proof-of-concept, not a deployed system. There are no users, no real
funds, and nothing on-chain. The parts that would make it a real
governance system — Sybil-resistant identity, cross-chain execution,
decentralized storage — are mocks or simulations, and are labelled as
such below and in the code. See the addendum at the top of `VISION.md`
for the real-vs-aspirational split.

## What's here

- **`src/` (TypeScript)** — the backend: `api/` (Express + Socket.IO),
  `core/` (proposal lifecycle state machine: DRAFT → SPONSORED →
  ACTIVE_VOTING → FUNDED / REJECTED → IN_PROGRESS → COMPLETED, with an
  EMERGENCY → FAST_TRACKED fast-track; quadratic voting/funding;
  liquid delegation; treasury with subject pools; milestone juries;
  Semaphore ZKP identity, PoC grade), `models/` (SQLite store),
  `chains/` (cross-chain **mocks** — the bridge returns `0x...`),
  `bridge/`, `cli/`, `utils/`.
- **`frontend/`** — React + Vite + TypeScript UI for browsing subjects,
  drafting proposals, delegating, and contributing funds.
- **`tests/`** — Jest: 27 suites, 86 tests.
- **`archive/protocol-bot/`** — the Executive Protocol repo-maintenance
  bot (version bumps, doc regeneration, branch merging, watchdog),
  archived 2026-11-19. It is not governance code, is not built or run,
  and starting the server no longer touches git. See its README.
- **`CONSTITUTION.md`, `PROTOCOL.md`, `PROTOCOL_SPEC.md`, `VISION.md`**
  — the governance design itself; `populate_delegations.ts` seeds
  delegation data. `Dockerfile`, `docker-compose.yml`, and `helm/`
  cover deployment (unused so far — nothing is deployed).

## Quick start

```bash
npm install
npm run build:backend   # tsc -> dist/
node dist/api/server.js # API on $PORT (default 3000), seeds demo users
npm test                # jest (backend)
cd frontend && npm install && npm run build && cd ..  # frontend build
```

## Status

Verified locally on 2026-11-19 at the fix commit that introduced this
README revision:

- Clean `npm install` works (it did not before: the Semaphore
  `@semaphore-protocol/proof` v3 pin conflicted with the v4
  group/identity pins, and `better-sqlite3` was a devDependency with no
  usable Node 24 build — both fixed).
- `tsc --noEmit` (full, incl. tests) and `tsc -p tsconfig.build.json`:
  zero errors.
- Jest: **86/86 tests, 27/27 suites, three consecutive full runs.**
  Before the fix the suite was not 30/30 as previously claimed: the
  ZKP test used the Semaphore v3 API against v4 packages, and
  dashboardApi/docker.e2e flaked because every parallel test worker
  shared one file-backed `dao.db` (the test store is in-memory now).
- Frontend `npm run build` passes (it did not before: a missing
  `src/vite-env.d.ts` and a dead archived component broke `tsc`).
- The built server starts, seeds demo data, and answers auth'd API
  calls; unauthenticated calls correctly return 401.

Not a deployed governance system — a reference implementation and
design repository.
