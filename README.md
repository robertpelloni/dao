# dao — "LiquidGov"

A proof-of-concept for a distributed, voluntary governance platform:
people form topic committees, draft structured proposals, vote with
quadratic voting, and crowdfund the work with assurance-style escrow and
milestone releases. Design-first, with a real TypeScript codebase
underneath the design docs.

## What's here

- **`src/` (TypeScript)** — the backend: `api/`, `core/` (proposal
  lifecycle state machine: DRAFT → SPONSORED → ACTIVE_VOTING → FUNDED /
  REJECTED → IN_PROGRESS → COMPLETED; quadratic voting module; escrow
  simulation), `models/`, `chains/` (cross-chain mocks), `bridge/`,
  `cli/`, `utils/`. Express + sockets for realtime updates.
- **`frontend/`** — React + Vite + TypeScript UI for browsing subjects,
  drafting proposals, delegating, and contributing funds.
- **`tests/`** — Jest, including `tests/protocol.integration.test.ts`.
- **`CONSTITUTION.md`, `PROTOCOL.md`, `PROTOCOL_SPEC.md`, `VISION.md`** —
  the governance design itself; `populate_delegations.ts` seeds
  delegation data. `Dockerfile`, `docker-compose.yml`, and `helm/` cover
  deployment. Identity/Sybil resistance is designed around Semaphore-style
  uniqueness proofs (see the core concepts in `VISION.md`).

Note on structure: the old README described a `backend/` directory; the
backend actually lives in `src/` at the root — there is no `backend/`
folder. It also declared "Phase 8 Complete"; the phases are this project's
own internal numbering in its roadmap docs, and "cross-chain" support is,
by its own wording, mocks.

Housekeeping worth knowing: the root carries ~25 one-shot `patch_*.py`
scripts (`patch_auth_server.py`, `patch_proposalGenerator_test3.py`,
`fix_conflict.py`, …) — leftovers of the agent workflow that edited this
repo by generating patch scripts — plus both `package-lock.json` and
`pnpm-lock.yaml`. They are not part of the application.

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

Working proof-of-concept (v1.0.13 per package.json), built May–July 2026;
recent commits are dependabot bumps and automated checkpoints. Not a
deployed governance system — a reference implementation and design
repository, as its own docs say.
