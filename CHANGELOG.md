# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2026-06-05
### Added
- Integrated `AutonomousWatchdog` into the main server start sequence for self-sustaining maintenance.
- Hardened `RepositoryManager` with restored autonomous protocol methods.
- Drafted the foundational `CONSTITUTION.md` for DAO governance.

## [1.0.0] - 2026-06-04
### Added
- **Quadratic Funding (QF)**: Implemented matching engine in `TreasuryManager` to amplify community-driven projects.
- **Reputation Economy**: Citizen rewards for subject-specific reputation upon milestone completion and jury service.
- **Randomized Juries**: Automated assignment of verified humans to project verification milestones.
- **Autonomous Execution**: Simulated payload execution hooks for completed proposals with audit logging.
- **AI Triage Agent**: Automated committee suggestions and redundancy detection for new proposals.
- **ZKP Identity**: Privacy-preserving proof-of-humanity integration via Semaphore.

## [0.9.9] - 2026-06-04
### Fixed
- Restored missing autonomous protocol methods in `RepositoryManager`.
- Synchronized `scripts/run-protocol.ts` with backend capabilities.
- Fixed Semaphore SDK v4 breaking changes.
- Exempted `VERSION.md` from documentation header checks.

## [0.8.5] - 2026-05-23
### Added
- Robust implementation of the "Executive Protocol" for autonomous repository management.
- Comprehensive integration tests for multi-branch merging and versioning.
- Enhanced documentation standards verification.

## [0.8.0] - 2025-05-22
### Added
- **Visual Delegation Graph**: Force-directed visualization of liquid delegation flows.

### Fixed
- Backend crash on GET requests in authentication middleware.

## [0.7.0] - 2025-05-15
### Added
- Milestone Oracle System: Multi-party jury consensus for fund release.
- Real-time Updates: WebSocket integration for live dashboard updates.
