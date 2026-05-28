# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

## [0.9.8] - 2026-05-26
### Added
- Integrated Executive Protocol Implementation: Automated roadmap extraction (syncRoadmap) and lifecycle management.
- Enhanced TODO.md Synchronization: Automated discovery of code-level TODO/FIXME items.
- Protocol CLI: Added `npm run protocol` for manual or automated sync triggers.
- Refined TaskManager: Integrated autonomous protocol into the internal DAO task lifecycle.
- Refined syncRoadmap logic with specific regex to avoid self-matching.

## [0.9.7] - 2026-05-26
### Added
- Enhanced CI/CD Pipeline: Granular jobs for verify, test, build, and deploy.
- Docker-based Staging Verification: Automated health checks within containerized environments in CI.
- Refined Deployment Engine: Enhanced `scripts/deploy.sh` with environment validation and artifact staging.
- Artifact Management: Integrated GitHub Actions artifact storage for backend and frontend builds.
- Security Gates: Automated `npm audit` in CI to detect high-level vulnerabilities.

## [0.9.6] - 2026-05-26
### Fixed
- Resolved command injection vulnerability in RepositoryManager.
- Fixed incorrect import path in reputation simulation tests.
- Added shell quoting for branch names to support spaces.
- Implemented missing ZKP foundation endpoints in the API.

## [0.9.4] - 2026-05-26
### Added
- Implemented formal repository initialization in RepositoryManager.
- Integrated Step 0: Initialize into the autonomous protocol lifecycle.
- Created automated deployment scripts (scripts/deploy.sh) and staging docker-compose.

## [0.9.3] - 2026-05-26
### Added
- Implemented Autonomous Watchdog for periodic repository synchronization.
- Integrated background protocol execution into the API server lifecycle.

## [0.9.2] - 2026-05-26
### Added
- Refined Executive Protocol with Section 2 (Intelligent Merge) and Section 3 (Roadmap Extraction).
- Hardened RepositoryManager with pre-merge testing and automated conflict logging.
- Automated synchronization of TODO.md with codebase findings.


## [0.9.0] - 2026-05-26
### Added
- Finalized Autonomous Development and Repository Management Protocol (Executive Protocol).
- Enhanced Pre-Merge Testing: Automatic test execution before merging feature branches to main.
- High-Priority Conflict Logging: Blocked merges are automatically logged to TODO.md.
- Atomic Versioning: Integrated `npm version` for synchronized package-lock updates.
- Standardized cross-platform execution scripts (.sh and .bat).
- AI Proposal Triage Agent: Implemented automated committee suggestions and redundancy detection.
- Integrated CI deployment pipeline: Enhanced GitHub Actions for comprehensive validation and deployment.
- ZKP Identity Layer (Phase 5.2): Initialized privacy-preserving identity foundation using Semaphore protocol.
