# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2025-05-14
### Added
- Persistent Storage using SQLite (`better-sqlite3`).
- AI Impact Scoring heuristics for proposals.
- Proposal sorting based on impact.
- Docker configuration (`Dockerfile`, `docker-compose.yml`).
- API endpoint for proposal scoring.

## [0.3.0] - 2025-05-14
### Added
- REST API Layer using Express with endpoints for users, committees, proposals, and delegation.
- Identity Layer (Sybil Resistance) mock with endorsement-based verification.
- Integrated identity verification into simulation.
- Manual verification and health check endpoints.

## [0.2.0] - 2025-05-14
### Added
- Liquid Delegation logic with transitive resolution and circularity detection.
- Crowdfunding and Escrow engine with Dominant Assurance and milestone release.
- Full lifecycle simulation CLI tool.
- Unit tests for Delegation and Crowdfunding.

## [0.1.0] - 2025-05-14
### Added
- Initial project implementation with Node.js/TypeScript.
- Core Quadratic Voting (QV) logic module.
- Proposal lifecycle state machine.
- Data models for Users, Committees, Proposals, and Milestones.
- Unit tests for QV and State Machine.
- Automated testing setup with Jest.

## [0.0.1] - 2025-05-14
### Added
- Initial project documentation: `VERSION.md`, `VISION.md`, `AGENTS.md`, `ROADMAP.md`, `TODO.md`, `CHANGELOG.md`.
- Basic project structure and goals definition.
