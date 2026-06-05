# Changelog

All notable changes to this project will be documented in this file.

## [1.0.1] - 2026-06-05
### Added
- **Security Engine**: Implemented `src/core/security.ts` with graph-based Sybil detection and reputation decay algorithms.
- **Sybil Resistance**: Automated flagging of suspicious delegation clusters during governance transitions.
- **Governance Transitions**: Enhanced `GovernanceManager` with automated security audits and standardized decay.
- **Integration Tests**: New `tests/security.integration.test.ts` verifying the core data-processing logic.

### Fixed
- Restored missing autonomous protocol methods in `RepositoryManager`.
- Synchronized `package-lock.json` with release version.
- Cleaned up internal git artifacts from the test directory.

## [1.0.0] - 2026-06-04
### Added
- **Quadratic Funding (QF)**: Implemented matching engine in `TreasuryManager`.
- **Reputation Economy**: Citizen rewards for subject-specific reputation.
- **Randomized Juries**: Automated assignment of verified humans to project verification.
- **Autonomous Execution**: State-transition hooks for simulated payload execution.
- **AI Triage Agent**: Automated committee suggestions and redundancy detection.
- **ZKP Identity**: Privacy-preserving proof-of-humanity integration.
