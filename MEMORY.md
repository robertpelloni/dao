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

## Version 0.8.0-0.8.1: The Protocol & Refinement
- **Executive Protocol:** The `RepositoryManager` now handles autonomous branch management and submodule synchronization, moving the project towards continuous autopilot.
- **JWT Authentication:** Replacing PoC header-based auth with a standard JWT foundation to improve security and prepare for real user sessions.
- **Identity Analytics:** Added subject-based power breakdown to provide citizens with granular insight into where their liquid power originates.

## Version 0.7.0: The Oracle & Real-time Sync
- **Milestone Oracle:** Funds are now locked until a jury quorum (majority by default) verifies the work. This addresses the "Oracle Problem" by requiring multi-party consensus.
- **WebSocket Integration:** Using `socket.io` to trigger silent frontend refreshes. This ensures all users see the latest vote counts and funding status without manual refreshes.
- **Merge Logic:** Handled a complex unrelated-history merge to consolidate the feature branch into `main`.

## Design Preferences & Lessons
- **Comments:** Ensure every non-trivial function has a docblock explaining *why* it exists, not just what it does.
- **Handoffs:** Keep `HANDOFF.md` strictly updated. The "next agent" needs a clear starting point.
- **Docker:** Build dependencies for `better-sqlite3` (python, make, g++) must be explicitly included in the slim Node images.

## Unresolved Methods / Experiments
- **Transitive Voting:** Experimented with deducting credits from delegators when a delegate votes. Decided to defer to Phase 4 for a more robust accounting system. Currently, the delegate's personal credits are used but checked against their *Total Effective Power*.

## Version 0.9.9: The AI & Privacy Milestone
- **AI Triage Agent:** Keyword-based committee matching and title-based redundancy detection provides immediate "Cognitive Meritocracy" assistance to users.
- **Semaphore ZKP:** Integration of Semaphore for identity verification allows for Sybil-resistant, privacy-preserving governance.
- **Protocol Integrity:** The RepositoryManager is the heart of the system; ensuring its methods (syncRoadmap, executeBuild, etc.) are robustly implemented is critical for long-term autonomous execution.

## Version 1.0.0: The Autonomous Core
- **Treasury Hardening:** Moving from simple crowdfunding to Quadratic Funding (QF) ensures that small donors have a massive collective impact, fulfilling the democratic vision.
- **Jury Dynamics:** Random assignment of jury duties from the pool of verified humans prevents collusion and distributes responsibility.
- **Reputation as Currency:** Reputation is now earned, not just mock-initialized. This creates a circular economy of expertise where successful delivery leads to more governance influence.
- **Code as Law:** The autonomous execution simulation (executeAutonomousPayload) is the precursor to real smart-contract triggers.
