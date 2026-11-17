# DEPLOYMENT

## Development Setup (verified 2026-11-17, v1.1.112)
1. Clone the repository.
2. Install dependencies: `npm install`.
3. Build the backend: `npm run build:backend` (src-only emit to `dist/` via `tsconfig.build.json`).
4. Run the API server — pick one:
   - Daemon (recommended): `npx ts-node scripts/tray.ts start` (BelowNormal priority, pidfile `.daemon.pid`, log `daemon.log`; `status` / `logs` / `quit` subcommands; quit stops the server).
   - Foreground: `node dist/api/server.js` or `npx ts-node src/api/server.ts`.
   - Health: `curl http://localhost:3000/health` → `{"status":"OK","version":"1.1.112"}`.
   - First run seeds demo users (alice/bob/charlie/dave) when the store is empty; skip with `LIQUIDGOV_NO_SEED=true`.
   - The Autonomous Watchdog is **off by default**; enable only deliberately with `LIQUIDGOV_ENABLE_WATCHDOG=true` (it commits and pushes to git).
5. Run the dashboard: `cd frontend; npm install; npm run dev` → http://localhost:5173 (Vite proxies `/api` → `:3000`).
6. Run simulation: `npx ts-node src/cli/simulate.ts`.
7. Tests: `npm test` (Jest, 30 suites).

## Docker Setup
1. Build and run: `docker-compose up --build`.
2. The API will be available at `http://localhost:3000`.


## API Endpoints
Base path is the server root; the dashboard calls them through the Vite `/api` proxy (prefix stripped). Auth: `POST /auth/login {userId}` → JWT (no `/auth/refresh` exists). Full route list lives in `src/api/server.ts`; the dashboard contract is pinned by `tests/dashboardApi.test.ts`. Highlights:
- `GET /health`, `GET /summary`
- `POST /users`, `GET /users`, `GET /users/:id`, `POST /users/:id/welcome`, `POST /users/:id/endorse`
- `GET /identity/:id`, `GET /identity/:id/breakdown`, `POST /identity/:id/verify-human`, `POST /identity/:id/verify-zkp`
- `POST /delegate`, `DELETE /delegate/:userId/:subject`, `GET /delegators/:userId/:subject`, `GET /power/:userId/:subject`
- `POST /committees`, `GET /committees`, `POST /committees/:id/join`, `POST /committees/auto-provision`, `GET /committees/suggested/:userId`
- `POST /proposals`, `GET /proposals`, `GET /proposals/suggested/:userId`, `POST /proposals/:id/vote|contribute|transition|finalize-funding|release-milestone|score`, `POST /proposals/:id/milestones/:mid/jury-vote`, `POST /proposals/triage`
- Treasury: `POST /treasury/deposit` (optional `subject` = subject pool), `GET /treasury/balances|balance|transactions`, `GET /treasury/pools`, `POST /treasury/intake|allocate`
- Governance: `GET /governance/cycle|cycles|trends`, `POST /governance/transition-cycle`, `GET /security/flagged`, `GET /api/governance/security-metrics|identity-analytics`, `POST /api/governance/auto-generate-proposal`
- Tasks: `GET /tasks`, `POST /tasks`, `POST /tasks/:id/execute` — **warning:** execute runs the Executive Protocol (git sync/merge/version-bump/push) against this repo.

## Production Deployment (Phase 9: Global Scaling) — ASPIRATIONAL
The Terraform/Kubernetes material below is a design sketch: there is no `terraform/` directory or `protocol:deploy` script in this repo. The real deployment assets are `Dockerfile`, `docker-compose.yml`, `docker-compose.staging.yml`, and `helm/`.
The LiquidGov architecture is designed for multi-region high availability and cross-border redundancy to ensure censorship resistance and fast identity bridging.

### Terraform & Kubernetes (Multi-Region Mesh)
To spin up the foundational jurisdiction-agnostic governance mesh, a standard Terraform configuration applies to AWS/GCP:

```hcl
module "liquidgov_mesh" {
  source = "./terraform/modules/mesh"

  regions = ["us-east-1", "eu-central-1", "ap-southeast-1"]
  instance_type = "t3.xlarge"

  # ZKP Verifier Scaling
  enable_zkp_auto_scaling = true
  max_zkp_replicas = 50

  # Cross-chain Bridge Relayers
  enable_bridge_relayers = true
}
```

### Deployment Execution
1. Configure credentials in `.env.prod`
2. Initialize Terraform: `terraform init`
3. Apply cross-region state: `terraform apply -auto-approve`
4. Trigger the Autonomous Deployer via Executive Protocol: `npm run protocol:deploy`
