# dao

Lightweight proof-of-concept for a distributed, voluntary governance platform (LiquidGov).

A reference implementation and design-first repository for coordinating subject-specific committees, structured proposals, and a crowdfunding + voting engine (quadratic voting / quadratic funding / assurance-style escrow).

Status

- Prototype / specification + small TypeScript backend and React frontend.
- Focus: data schemas, deterministic proposal lifecycle, and a modular quadratic voting engine.

Why this project

Large public problems require coordinated, accountable, and incentive-aligned decision-making. This repo captures a pragmatic blueprint and an initial codebase for a decentralized, voluntary governance system where people form committees, draft structured proposals, vote, and crowdfund work.

Core concepts

- Identity: Sybil resistance / proof-of-unique-human is required. This repo integrates identity tooling (Semaphore libraries) to support privacy-preserving uniqueness checks and future DID integrations.
- Committees: Topic-specific, dynamic groups that manage deliberation for a subject node.
- Proposals: Structured JSON-based objects with milestones, budgets, and execution hooks. Proposals move through a deterministic lifecycle (DRAFT → SPONSORED → ACTIVE_VOTING → FUNDED / REJECTED → IN_PROGRESS → COMPLETED).
- Voting & Treasury: Quadratic voting for voice allocation, and crowdfunding with dominant-assurance-style escrow and milestone-based releases.

What’s included

- backend/ (TypeScript + Express): core API, state machines for committees & proposals, quadratic voting module, escrow simulation, and sockets for realtime updates.
- frontend/ (React + Vite + TypeScript): lightweight UI for browsing subjects, drafting proposals, delegating, and contributing funds.
- scripts/: utility and CI helpers (build, sync-protocol, verify-docs).
- package.json & frontend/package.json: build, test, and protocol scripts.

Quick start (development)

Prerequisites:
- Node.js (18+ recommended)
- npm or yarn

Install and run backend + frontend locally:

1. Clone

   git clone https://github.com/robertpelloni/dao.git
   cd dao

2. Install dependencies

   npm install
   cd frontend && npm install
   cd ..

3. Start backend (from repo root)

   # compile and run the TypeScript backend
   npm run build:backend
   node ./dist/index.js

   Or use the combined build script:
   npm run build

4. Start frontend (in a separate terminal)

   cd frontend
   npm run dev

Key scripts

- npm run build:backend — compile TypeScript backend
- npm run build — run repository build script (scripts/build.sh)
- npm run protocol — run repo sync protocol (scripts/sync-protocol.sh)
- npm test — runs Jest tests (integration/unit)
- frontend: npm run build — build the frontend site

Developer notes

- Data schemas: Proposals are serialized JSON objects with required fields: title, abstract, detailed_specs, milestones (array of {title, description, amount, release_condition}), target_budget, and execution_payload (optional hook/address).
- Voting engine: Quadratic voting implemented as a pure module. The cost to cast n votes is n^2 voice credits. The module is designed for unit testing and isolated validation.
- Escrow: Dominant assurance pattern — funds are held until target is met. If the campaign expires underfunded, contributions are refunded. When milestones are reached, funds are released to the proposer via a multi-party verification flow.
- Identity integration: Semaphore libraries are included in package.json to support proof-of-unique-human primitives. Replace or extend with WorldID, Gitcoin Passport, or a custom DID flow as needed.

Testing

- Unit tests: npm test
- Frontend tests: cd frontend && npm run test:frontend (playwright)
- Protocol integration: npm run test:protocol

Architecture & next steps

The repository is intentionally modular to let teams adopt one piece at a time:

1. Tighten the identity layer (pick a Sybil-resistance provider and wire ZKPs or blinded tokens).
2. Harden the proposal lifecycle and milestone oracle (multi-sig + randomized jury for milestone verification).
3. Deploy a simple onchain or offchain escrow implementation for real funds.

Contributing

Contributions are welcome. Please open issues for proposed features or design changes. For code contributions, follow the standard fork → branch → PR workflow. If you plan to implement large features (identity, on-chain escrow, or production voting), open an issue first to coordinate.

License

This project is released under the ISC license. See LICENSE for details.

Contact

Repo: https://github.com/robertpelloni/dao

