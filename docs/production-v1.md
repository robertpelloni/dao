# LiquidGov Production Blueprint (v1)

## 1. Kubernetes Deployment & Auto-Scaling
LiquidGov is designed to scale dynamically to handle massive engagement spikes using Kubernetes and Helm.

### Helm Charts
The API is deployed using the custom Helm chart located in `helm/liquidgov/`.
*   **Horizontal Pod Autoscaling (HPA):** The deployment is configured to automatically scale up to 10 replicas (configurable via `values.yaml`) when CPU or memory utilization exceeds 80%. This ensures the target throughput of 10k req/sec during active voting cycles.
*   **Liveness and Readiness Probes:** Kubernetes continuously monitors the `/health` endpoint. If a pod halts or becomes unresponsive, Kubernetes automatically terminates and replaces it.
*   **Resource Limits:** Hard limits are set (e.g., 512Mi Memory, 500m CPU) to prevent OOM kills and ensure graceful degradation under extreme load.

## 2. Chaos Engineering
To ensure the robustness of the system, we implement Chaos Engineering tests, specifically targeting the Security Engine:
*   **51% Sybil Attack Simulation:** We simulate coordinated Sybil attacks by injecting thousands of synthetic delegations into the SQLite store concurrently. The goal is to verify that the `SecurityEngine` graph-based detection isolates and flags the cluster *before* the fast-track or automatic oracle endpoints can be manipulated.
*   **Pod Failure Injection:** Randomly terminating API pods during high-volume voting epochs to ensure the SQLite persistence layer and the `Executive Protocol` watchdog recover without data corruption.

## 3. Cross-Chain Treasury Sync
As LiquidGov bridges multiple chains (Ethereum, Polygon, Solana), the treasury must maintain consistent global state.
*   **Cron Job Architecture:** A scheduled daemon (running every 5 minutes) triggers the `MultiChainBridge` reconciliation process.
*   **Token Anchoring:** The sync utilizes the `tokenSymbol` provided in the `POST /proposals/:id/contribute` payload. The cron job aggregates deposits across chains for the specified token and updates the centralized `ExchangeRateOracle` and matching pool balances, ensuring cross-chain QF matching is accurate.

## 4. Emergency Governance Failover
In the event that the standard Quadratic Voting committee process halts (e.g., due to extreme network congestion or a compromised committee quorum), the system falls back to Emergency Governance.
*   **Trigger:** The `globalWatchdog` monitors proposal velocity. If a highly critical proposal (flagged via `evaluateEmergencyFastTrack`) is stalled, the watchdog auto-escalates it.
*   **Fast-Track Path:** The proposal enters the `FAST_TRACKED` state, completely bypassing the standard QV period.
*   **Weighted Jury Resolution:** Standard voting is replaced by a randomized, high-reputation jury. The quorum requirement is lowered dynamically to ensure immediate dispute resolution and fund execution, keeping the protocol un-bricked.
