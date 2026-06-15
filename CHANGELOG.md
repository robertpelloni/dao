# Changelog

## [1.1.3] - 2026-06-15
### Added
- **Voluntary Tax Routing**: Citizens can now route contributions to subject-specific matching pools, ensuring their capital supports their chosen domains.
- **Meritocratic Voice Credits**: Governance transitions now award bonus voice credits (capped at 50) based on accumulated subject reputation.
- **Emergency Fast-track**: Critical proposals (e.g., infrastructure failures) can bypass sponsorship and jump directly to active voting.
- **Expert-Weighted Juries**: Milestone verification juries prioritize citizens with relevant subject reputation; expert votes count double.
- **Milestone Dispute System**: Juries can now reject milestones, triggering a "Disputed" state and halting fund release.
- **Security: Delegation Chain Analysis**: The Security Engine now detects and flags suspicious delegation clusters with chains exceeding a depth of 3.
- **Committee Sunsetting**: Automated recycling of matching funds from inactive committees (60 days dormancy) back to the General pool.

### Changed
- Gated ZKP mock verification to non-production environments (`process.env.NODE_ENV !== 'production'`).
- Optimized `CrowdfundingEngine` to intelligently source matching funds from subject-specific pools first.
- Synchronized all core scripts with Windows `.bat` equivalents for platform parity.

## [1.1.2] - 2026-06-15
### Added
- **Fiscal Democracy UI**: Added treasury reallocation controls to the frontend.
- **Matching Multiplier Visualization**: Real-time QF amplification estimates for contributors.
- **Automated Protocol Sync**: Enhanced APEP for conflict-aware merging across AI-generated branches.

...
