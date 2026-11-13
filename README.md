# dao — "LiquidGov"

A proof-of-concept for a distributed, voluntary governance platform:
people form topic committees, draft structured proposals, vote with
quadratic voting, and crowdfund the work with assurance-style escrow
and milestone releases. Design-first, with a real TypeScript codebase
underneath the design docs.

## What's here

- **`src/` (TypeScript)** — the backend: `api/`, `core/` (proposal
  lifecycle state machine: DRAFT → SPONSORED → ACTIVE_VOTING → FUNDED /
  REJECTED → IN_PROGRESS → COMPLETED; quadratic voting module; escrow
  simulation), `models/`, `chains/` (cross-chain mocks), `bridge/`,
  `cli/`, `utils/`. Express + Socket.IO for realtime updates.
- **`frontend/`** — React + Vite + TypeScript UI for browsing subjects,
  drafting proposals, delegating, and contributing funds.
- **`tests/`** — Jest, including `tests/protocol.integration.test.ts`.
- **`CONSTITUTION.md`, `PROTOCOL.md`, `PROTOCOL_SPEC.md`, `VISION.md`**
  — the governance design itself; `populate_delegations.ts` seeds
  delegation data. `Dockerfile`, `docker-compose.yml`, and `helm/`
  cover deployment. Identity/Sybil resistance is designed around
  Semaphore-style uniqueness proofs (see the core concepts in
  `VISION.md`; `@semaphore-protocol/*` packages are real dependencies).

Notes on the repo's own claims: an old README described a `backend/`
directory — the backend actually lives in `src/` at the root; there is
no `backend/` folder. "Cross-chain" support is, by the project's own
wording, mocks. Version numbering is inconsistent across files
(`package.json` 1.0.13, `VERSION.md` lists 1.1.108 and 1.0.11).

## Quick start

```bash
npm install
cd frontend && npm install && cd ..
npm run build:backend   # tsc
node ./dist/index.js
npm test                # jest (backend)
npm run test:all        # backend tests + frontend build
```

## Status

Working proof-of-concept, actively developed through November 2026
(last commit 2026-11-07; recent work is dashboard consolidation and a
tray/daemon controller). Not a deployed governance system — a
reference implementation and design repository, as its own docs say.
