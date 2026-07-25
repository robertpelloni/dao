# Modular Sharding Design for LiquidGov

## 1. Objective
To scale LiquidGov to 10,000+ concurrent proposals globally (Phase 9) without congesting the core governance loops or the centralized SQLite network synchronization engine.

## 2. The Bottleneck: Flat Committee Architecture
Currently, all proposals and delegations share the same flat `Store` database. As activity scales, calculating `EffectivePower` by traversing the entire delegation graph (for every user, for every subject) becomes an $O(N^2)$ bottleneck during voting spikes.

## 3. Sharded Committee Subject Trees
To resolve this, we will implement **Subject-Based State Sharding**.

### 3.1 Hierarchical Subjects
Instead of arbitrary text subjects (e.g., "General", "Infrastructure"), subjects become a hierarchical tree:
*   `Global` (Root)
    *   `Infrastructure`
        *   `Roads`
        *   `Grid`
    *   `Science`
        *   `Space`

### 3.2 State Partitioning
Each top-level subject node (e.g., `Infrastructure`) becomes an independent SQLite database shard (or independent rollup state).
*   **Proposals:** A proposal bound to `Infrastructure -> Roads` is only stored in the `Infrastructure` shard.
*   **Delegations:** The delegation graph is maintained locally on the shard. If Alice delegates to Bob for `Infrastructure`, that edge only exists in the `Infrastructure` shard.
*   **Global Treasury:** The main treasury contract remains on the `Global` root shard. The root handles cross-shard matching pool allocations via standard messaging bridges.

## 4. Cross-Shard Synchronization via NetworkInterface
The existing `NetworkInterface` (`src/core/protocol/network.ts`) will be extended to support shard routing:
1.  When a node boots up, it subscribes only to the shards/committees it is interested in validating.
2.  `syncProposals(peerUrl, shardId)` fetches deltas strictly for that partition.
3.  The `Watchdog` and `ProposalStateMachine` run localized instances per shard, significantly reducing CPU load per node.

## 5. Security & Sybil Clusters
The `SecurityEngine` will process the delegation depth within individual shards. If a Sybil cluster attempts to attack a specific sub-committee (e.g., `Science -> Space`), they must accumulate raw voice credits locally, preventing them from leveraging completely unrelated influence from the `Infrastructure` shard to force quorum.
