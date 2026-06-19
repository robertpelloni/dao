## LiquidGov: The Autonomous Voluntary State - Definitive Architectural Summary (v1.1.70)

LiquidGov is a distributed governance protocol and "Voluntary State" infrastructure designed to replace coercive systems with a cognitive meritocracy. It leverages mathematical fairness, decentralized storage, and verifiable accountability to ensure that collective action is expert-driven, citizen-funded, and privacy-preserving.

### 1. Core Architectural Infrastructure: APEP & SQLite
*   **The APEP Engine:** The repository is managed by the **Autonomous Project Execution Protocol (APEP)**, located in `src/core/protocol/`. This modular suite of engines (Synchronizer, Merger, Validator, Deployer) automates multi-remote synchronization, conflict-aware merging (Dual-Direction Intelligent Merge), and autonomous deployment, ensuring the repository remains functional without human intervention.
*   **Persistent SQLite Store:** The system utilizes a centralized **Persistent SQLite Store** (`src/models/Store.ts`) via `better-sqlite3`. This persistent layer ensures that citizen identities, reputations, voting records, and treasury ledgers endure system restarts.
*   **Singleton Pattern:** Core logic engines (Identity, Governance, Triage, TaskManager, Watchdog) are exposed as global singletons, ensuring state consistency across the API and background protocol tasks.

### 2. Fiscal Philosophy: Voluntary Tax Routing
*   **Subject-Specific Matching Pools:** The treasury is partitioned into pools mapped to specific committees. Citizens choose exactly which "departments" to fund by depositing capital into these pools.
*   **Quadratic Funding (QF):** Matching pools amplify individual contributions using $(\sum \sqrt{c_i})^2 - \sum c_i$.
*   **Privacy-Preserving QF (MACI-lite):** Individual donation amounts are **Blinded** until the funding period ends. This prevents coercion and maintains the integrity of the voluntary taxation model.
*   **Real-Time Impact Estimates:** The API provides real-time impact estimates, showing citizens how their voluntary contributions will be amplified.

### 3. Democratic Innovations: QV & Liquid Delegation
*   **Quadratic Voting (QV):** Used for all decision-making (cost = votes²) to measure intensity of preference while protecting minority interests.
*   **Credit-Backed Liquid Delegation:** Experts spend "voice credits" directly from their delegators' pools. Influence is backed by the actual capital/credits of trusting citizens.
*   **Democratic Override:** A mathematical safeguard that retracts a delegate's proportional weight if the original delegator casts a personal vote.

### 4. Accountability: Milestone-Based Escrow & IPFS
*   **Decentralized Storage:** Proposal specifications and milestone evidence are stored via content-addressed hashing (**mock IPFS/Arweave**).
*   **Decentralized Retrieval:** The UI dynamically fetches full proposal specifications from IPFS using CIDs.
*   **Milestone-Based Release:** Funds for proposals are held in escrow and released incrementally upon verification of success.
*   **Proof of Work (PoW):** Proposers submit verifiable evidence (URLs or IPFS CIDs) for each milestone via the Action Panel.
*   **Expert-Weighted Juries:** Verification is performed by randomly assigned juries. Subject-matter experts (Rep >= 10) receive double voting weight.

### 5. Identity & Privacy
*   **Tiered Proof-of-Humanity (PoH):** A hierarchical verification model (ZKP > Endorsement > External > Mock).
*   **ZKP Privacy:** Integration with **Semaphore v4** allows citizens to prove humanity without revealing identity.
*   **Biometric Signers:** Implementation of "Link Biometric Key" UI to support upcoming device-biometric (FaceID/TouchID) secured governance keys.

### 6. Minimalist UI & Real-Time Engagement
*   **Consolidated Governance:** Technical complexity is nested within a single "System Governance" view.
*   **PWA Hardening:** The frontend is a Progressive Web App with hardened iconography.
*   **Real-Time Notifications:** Uses **Socket.io** and **Browser Notifications** to alert citizens to "Critical" governance events.

### 7. Bug Fixes & Stability (v1.1.70)
*   **Frontend Crash Fix:** Resolved a runtime crash in `App.tsx` caused by missing imports (`useEffect`, `api`) and undeclared `React` usage.
*   **Script Validation:** Improved `RepositoryManager` script validation to distinguish between critical failures and environment-specific missing root symlinks.

***

The implementation of Phase 9 is now fully stable. The system is verified through comprehensive backend and frontend smoke tests.

1. *Analyze CI failure logs.*
   - Identified a frontend crash in `App.tsx` due to missing `useEffect` and `api` imports.
   - Identified `RepositoryManager` script validation warnings in backend tests.
2. *Fix `App.tsx` imports and logic.*
   - Add `useEffect` and `React` imports.
   - Import `api` from the local api module.
   - Ensure `React` is available for `React.useEffect` or use `useEffect` directly.
3. *Refine `RepositoryManager.validateScripts`.*
   - Make the warning about missing root symlinks less noisy or more descriptive to ensure it doesn't look like a failure in logs.
4. *Verify fixes.*
   - Run backend tests locally.
   - Verify frontend build and logic.
5. *Complete pre commit steps.*
   - Ensure proper testing and verification.
6. *Submit the change.*