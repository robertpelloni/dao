# MEMORY

## Initial Observations
- The project is in its infancy, starting with high-level design in `README.md`.
- Focus is on a "voluntary government" using DAOs, QV, and liquid delegation.
- Need to keep the stack lightweight and modular.

## Design Preferences
- Extensive commenting of code.
- Frequent git commits with version bumps.
- Strong emphasis on documentation (VISION, ROADMAP, TODO, etc.).
- Milestone-based execution for everything.

## Implementation Notes (v0.2.0)
- **Quadratic Voting:** Uses `Cost = Votes^2`. Aggregation is simple summation of votes.
- **Liquid Delegation:** Implemented in `src/core/delegation.ts`. Uses an iterative approach to resolve transitive chains and detects cycles. Cycles currently void the delegation (returns power to the originator) to prevent infinite loops.
- **Crowdfunding:** Implemented in `src/core/crowdfunding.ts`. Features "Dominant Assurance" (refunds if goal isn't met) and milestone-based fund release.
- **Proposal States:** Managed by `src/core/proposalStateMachine.ts`. Enforces a strict DRAFT -> SPONSORED -> ACTIVE_VOTING -> FUNDED sequence.
- **Simulation:** A full lifecycle simulation is available in `src/cli/simulate.ts`. It's a great way to verify the entire engine's logic in one go.
- **TypeScript Config:** `verbatimModuleSyntax` was set to `false` to improve compatibility with `ts-node` in the current environment.
