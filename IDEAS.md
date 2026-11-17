# IDEAS for LiquidGov

## Technical Improvements
- **Zero-Knowledge Identity:** Use semaphore.js or similar for anonymous but verified voting.
- **On-chain Execution:** Integration with EVM or other smart contract platforms to make "Action Hooks" trustless.
- **Decentralized Storage:** Use IPFS or Arweave for proposal metadata and milestone proofs.
- **Graph Database:** Transition the Subject Tree to a graph database (like Neo4j) to better handle complex delegations.

## Feature Enhancements
- **AI Triage:** An AI agent that reads new proposals and automatically tags them, identifies redundancies, and suggests potential expert delegates.
- **Dispute Resolution:** A "Jury" module where randomly selected users can review milestone proof of work.
- **Mobile First App:** Given the "voluntary government" goal, a mobile app with push notifications for urgent votes is crucial.
- **Reputation Decay:** Reputation in subjects should slowly decay if the user is inactive, ensuring governance is led by current experts.
- **Emergency Proposals:** A fast-track state for critical infrastructure failures (e.g., "Water Main Break").

## Structural Porting
- **Rust Port:** For the core engine, porting to Rust would provide better safety guarantees and WASM compatibility for both frontend and blockchain execution.
- **Nix Integration:** For reproducible builds and environment setup.

## Addendum 2026-11-17
- **Contract-first dashboard:** generate the frontend API client from server routes (or a shared route manifest checked in CI) so UI?backend drift (the 2026-11-17 outage class: 7 missing endpoints, one 404 emptying the UI) fails the build instead of the demo.
- **Watchdog dry-run mode:** `LIQUIDGOV_WATCHDOG_DRY_RUN=true` that logs the protocol plan (branches, bump, files) without committing — safe way to demo autonomy.
- **Subject-pool routing in QF matching:** pull matches from a proposal's subject pool before the general pool (pools now exist; matching still only reads token pools).
- **Real tray icon via a tiny Go/Rust systray helper** calling `scripts/tray.ts` commands, only if the CLI controller proves insufficient.

