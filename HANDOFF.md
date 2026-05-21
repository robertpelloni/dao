# HANDOFF

## Current Status - Version 0.1.0
- Core documentation and project vision established.
- Project initialized with TypeScript and Jest.
- Data models for `User`, `Committee`, `Proposal`, and `Milestone` implemented in `src/models/types.ts`.
- Quadratic Voting (QV) math module implemented in `src/core/qv.ts`.
- Proposal lifecycle state machine implemented in `src/core/proposalStateMachine.ts`.
- Unit tests for both QV and state transitions are passing.

## Next Steps for the Next Agent
1. **Liquid Delegation:** Implement the logic to allow users to delegate their voting power by subject.
2. **Crowdfunding Engine:** Implement the "Dominant Assurance" crowdfunding logic, handling escrow and milestone-based releases.
3. **Identity Verification Mock:** Create a more detailed mock/prototype for the Sybil-resistant identity layer.
4. **Initial API/CLI:** Create a way to interact with the core logic (e.g., creating a user, creating a proposal, and casting a QV vote).

## Key Implementation Details
- The project uses a simple in-memory `Store` for now.
- `package.json` contains the `test` script using Jest.
- All core logic should be thoroughly commented as per `AGENTS.md`.

## Files to build upon
- `src/core/qv.ts`
- `src/core/proposalStateMachine.ts`
- `src/models/types.ts`
- `src/models/Store.ts`
