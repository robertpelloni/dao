# TODO

## Documentation & Setup
- [x] Create `VERSION.md`
- [x] Create `VISION.md`
- [x] Create `AGENTS.md`
- [x] Create `ROADMAP.md`
- [x] Create `CHANGELOG.md`
- [x] Create `MEMORY.md`
- [x] Create `DEPLOY.md`
- [x] Create `HANDOFF.md`
- [x] Create model-specific instructions (CLAUDE.md, GEMINI.md, GPT.md, copilot-instructions.md)

## Implementation - Sprint 1
- [x] Initialize project with a lightweight tech stack (e.g., Node.js/TypeScript).
- [x] Implement data models for:
    - User (Identity, Voice Credits)
    - Committee (Subject, Members, Delegates)
    - Proposal (Milestones, Budget, Status, Payload)
- [x] Implement Quadratic Voting (QV) math module.
- [x] Write unit tests for QV logic.
- [x] Implement Proposal state machine transitions.

## Implementation - Sprint 2
- [x] Integrate Liquid Delegation logic.
- [x] Implement Crowdfunding Escrow logic.
- [x] Setup simulation for the core engine.
- [x] Setup API layer (Express/Fastify).
- [x] Implement Persistent Storage (SQLite).
- [x] Implement AI Impact Scoring.
- [x] Initial Frontend prototype (React/Tailwind).

## Implementation - Sprint 3
 - [x] Implement Committee management UI.
 - [x] Implement Identity endorsement UI.
 - [x] Add Form for creating new Proposals.
 - [x] Integrate real-time updates (WebSockets).

## Implementation - Sprint 4
 - [x] Implement Milestone Oracle System (Jury Voting).
 - [x] Integrate Autopilot Protocol into CI.
 - [x] Implement Core Repository Handling Module.
 - [ ] Add Visual Delegation Graph.
 - [ ] JWT Authentication.
