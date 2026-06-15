## [1.0.134] - 2026-06-15
## [1.0.134] - 2026-06-15
### Added
- Automated Protocol Sync and Branch Reconciliation.

## [1.0.121] - 2026-06-15
## [1.0.121] - 2026-06-15
### Added
- Automated Protocol Sync and Branch Reconciliation.

## [1.0.118] - 2026-06-15
## [1.0.118] - 2026-06-15
### Added
- Automated Protocol Sync and Branch Reconciliation.

## [1.0.116] - 2026-06-15
## [1.0.116] - 2026-06-15
### Added
- Automated Protocol Sync and Branch Reconciliation.

## [1.0.110] - 2026-06-15
## [1.0.110] - 2026-06-15
### Added
- Automated Protocol Sync and Branch Reconciliation.

## [1.0.100] - 2026-06-15
## [1.0.100] - 2026-06-15
### Added
- Automated Protocol Sync and Branch Reconciliation.

## [1.0.98] - 2026-06-15
## [1.0.98] - 2026-06-15
### Added
- Automated Protocol Sync and Branch Reconciliation.

## [1.0.78] - 2026-06-15
## [1.0.78] - 2026-06-15
### Added
- Automated Protocol Sync and Branch Reconciliation.

## [1.0.76] - 2026-06-15
## [1.0.76] - 2026-06-15
### Added
- Automated Protocol Sync and Branch Reconciliation.

## [1.0.70] - 2026-06-15
## [1.0.70] - 2026-06-15
### Added
- Automated Protocol Sync and Branch Reconciliation.

## [1.0.52] - 2026-06-15
## [1.0.52] - 2026-06-15
### Added
- Automated Protocol Sync and Branch Reconciliation.

## [1.0.34] - 2026-06-15
### Added
- **Emergency Proposal System**: Added fast-track status for critical infrastructure/safety issues with immediate voting activation.
- **Mobile PWA Support**: Enhanced frontend for mobile-first use, including offline capabilities and responsive UI refinements for smaller screens.
- **Reputation-based Discovery**: Implemented an intelligent suggestion engine that ranks proposals for users based on their subject-specific reputation.
- **Vite Plugin PWA**: Integrated PWA plugin for "Add to Home Screen" and persistent citizen engagement.

## [1.0.25] - 2026-06-15
## [1.0.25] - 2026-06-15
### Added
- Automated Protocol Sync and Branch Reconciliation.

## [1.0.19] - 2026-06-15
## [1.0.19] - 2026-06-15
### Added
- Automated Protocol Sync and Branch Reconciliation.

# Changelog

All notable changes to this project will be documented in this file.

## [1.0.23] - 2026-06-15
### Added
- **Milestone Dispute System:** Juries can now reject milestones, triggering a "Disputed" state and halting fund release.
- **Reputation Slashing:** Proposers whose milestones are rejected by a jury quorum suffer a significant loss in subject reputation.
- **Enhanced Jury UI:** Added "Approve" and "Reject" controls for assigned jury members with weighted quorum feedback.

## [1.0.21] - 2026-06-15
### Added
- **QF Impact Estimation:** Citizens now see real-time estimates of how much matching capital their contribution will trigger before they commit.
- **Amplification UI:** Added impact multiplier and delta visualization to the crowdfunding panel.

## [1.0.15] - 2026-06-15
### Added
- **Expert-Prioritized Juries:** Milestone verification juries now automatically prioritize citizens with subject-matter reputation.
- **Weighted Milestone Quorum:** Expert votes (rep >= 10) now count double during milestone verification, allowing faster fund release by trusted specialists.
- **Clean Repository Governance:** Refactored APEP Metadata Governance to generate readable, actionable `TODO.md` lists from codebase scanning.

## [1.0.13] - 2026-06-15
### Added
- **Stake-based Reputation:** Citizens now earn 1 reputation unit per $10 USD contributed to a matching pool, directly linking financial support to governance influence.
- **Contribution Attribution:** Treasury transactions now track the `userId` of the donor for transparent reputation rewards and auditing.

## [1.0.12] - 2026-06-15
### Added
- **Targeted Voluntary Taxation:** citizens can now route their voluntary tax to specific committees (subjects).
- **Intelligent Match Routing:** `CrowdfundingEngine` automatically pulls from subject-specific pools first, falling back to 'General'.
- **Enhanced Treasury Dashboard:** Added subject breakdown cards and transaction filtering.
- **Subject-Aware API:** Treasury endpoints now support subject-based querying and routing.

## [1.0.11] - 2026-06-07
### Added
- **Voluntary Tax Infrastructure:** citizens can now voluntarily fund matching pools.
- **Treasury Dashboard:** UI for auditing multi-token matching pools and transaction history.
- **Persistent Treasury:** Added `matching_pools` and `treasury_transactions` tables to SQLite store.
- **Automated Match Allocation:** `CrowdfundingEngine` now automatically deducts matching funds from the treasury during proposal finalization.

## [1.0.10] - 2026-06-07
### Added
- Automated Protocol Sync and Branch Reconciliation.

## [1.0.5] - 2026-06-05
### Added
- **Formalized Treasury Intake**: Added `treasury_transactions` ledger for matching pool auditing.
- **Participation Auditing**: Persistent SQL records for all votes and contributions to support high-fidelity security analysis.
- **Identity Prioritization**: Hierarchical Proof-of-Humanity logic to preserve the strongest citizen verification method.
- **Integration Milestone**: Verified end-to-end stability with protocol and security regression tests.

## [1.0.4] - 2026-06-05
### Added
- **Security Engine**: Implemented `src/core/security.ts` with graph-based Sybil detection and reputation decay algorithms.
- **Sybil Resistance**: Automated flagging of suspicious delegation clusters during governance transitions.
- **Governance Transitions**: Enhanced `GovernanceManager` with automated security audits and standardized decay.
- **Integration Tests**: New `tests/security.integration.test.ts` verifying the core data-processing logic.
- **ZKP Identity Verification**: Added `POST /identity/:id/verify-zkp` endpoint and UI flow for privacy-preserving proof-of-humanity.

### Fixed
- Restored missing autonomous protocol methods in `RepositoryManager`.
- Synchronized `package-lock.json` with release version.
- Cleaned up internal git artifacts from the test directory.

## [1.0.1] - 2026-06-05
### Added
- Automated protocol sync and branch reconciliation.

## [1.0.0] - 2026-06-04
### Added
- **Quadratic Funding (QF)**: Implemented matching engine in `TreasuryManager`.
- **Reputation Economy**: Citizen rewards for subject-specific reputation.
- **Randomized Juries**: Automated assignment of verified humans to project verification.
- **Autonomous Execution**: State-transition hooks for simulated payload execution.
- **AI Triage Agent**: Automated committee suggestions and redundancy detection.
- **ZKP Identity Layer**: Foundation for privacy-preserving proof-of-humanity.

## [0.8.8] - 2026-05-23
### Added
- Automated protocol sync and branch reconciliation.

## [0.8.5] - 2026-05-23
### Added
- Robust implementation of the "Executive Protocol" for autonomous repository management.
- Comprehensive integration tests for multi-branch merging and versioning.

## [0.8.0] - 2025-05-22
### Added
- **Visual Delegation Graph**: Implemented a force-directed graph in the Identity View.

## [0.7.0] - 2025-05-15
### Added
- Milestone Oracle System: Multi-party jury consensus for milestone fund release.
- Real-time Updates: WebSocket integration for live dashboard updates.
