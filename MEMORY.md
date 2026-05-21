# MEMORY - Ongoing Insights & Observations

## Version 0.1.0-0.3.0: The Foundation
- **Quadratic Voting:** The math is simple but powerful ($C = V^2$). Verified that it works as a pure function.
- **Liquid Delegation:** Circularity is the biggest technical challenge. The current solution returns the originator as the terminal node if a cycle is detected, which effectively halts transitive power flow into the loop.
- **State Machine:** Deterministic transitions are key. The proposal lifecycle is strictly enforced.

## Version 0.4.0: Persistence & AI
- **SQLite Transition:** Moving from in-memory Maps to `better-sqlite3` was essential. Note: Always `JSON.stringify` nested objects (milestones, reputation) for storage in SQLite TEXT fields.
- **AI Scoring:** Using heuristics (budget/milestone ratio) works as a great placeholder for a real LLM-based analysis. It provides immediate value for proposal ranking.

## Version 0.5.0-0.6.0: The Frontend
- **Tech Stack:** React + Vite + Tailwind CSS provides the best "Insanely Great" development speed and UX results.
- **UI Design:** High-contrast slate/blue theme feels authoritative yet modern.
- **Component Pattern:** Using a centralized `useDashboard` hook simplifies state management across multiple tabs.
- **Vite Proxy:** Configured proxy to handle CORS issues between frontend (5173) and backend (3000).

## Design Preferences & Lessons
- **Comments:** Ensure every non-trivial function has a docblock explaining *why* it exists, not just what it does.
- **Handoffs:** Keep `HANDOFF.md` strictly updated. The "next agent" needs a clear starting point.
- **Docker:** Build dependencies for `better-sqlite3` (python, make, g++) must be explicitly included in the slim Node images.

## Unresolved Methods / Experiments
- **Transitive Voting:** Experimented with deducting credits from delegators when a delegate votes. Decided to defer to Phase 4 for a more robust accounting system. Currently, the delegate's personal credits are used but checked against their *Total Effective Power*.
