# archive/protocol-bot — Executive Protocol (archived 2026-11-19)

This is the autonomous repo-maintenance bot that used to live inside the
LiquidGov governance codebase:

- `src/core/protocol/` — controller, deployer, governance (TODO/ROADMAP
  regeneration), merger, synchronizer, validator
- `src/core/repository.ts` — RepositoryManager (git sync, branch
  reconciliation, version bumps, HANDOFF generation, build + push)
- `src/core/watchdog.ts` — AutonomousWatchdog (opt-in timer that ran the
  protocol; it auto-pushed commit d1ad540 on 2026-11-17 before being gated)
- `scripts/run-protocol.ts`, `scripts/init-repo.ts`, `scripts/sync-protocol.*`
- `tests/` — the bot's own integration/unit tests (excluded from the
  main Jest run and from tsconfig)

It was archived, not deleted, at Robert's direction: it is not governance
code, and running a server or a task must never mutate git. The code is
preserved here for reference and is **not built, not tested, and not run**
as part of LiquidGov. Its internal relative imports still point at the
old `src/core/...` layout.

Note: `src/core/protocol/network.ts` was *not* part of this bot — it is
the governance cross-node sync mock used by `src/chains/bridge.ts`.
It now lives at `src/core/network.ts`.
