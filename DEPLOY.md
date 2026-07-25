# DEPLOYMENT

## Development Setup
1. Clone the repository.
2. Install dependencies: `npm install`.
3. Run simulation: `npx ts-node src/cli/simulate.ts`.
4. Run API server: `npx ts-node src/api/server.ts`.

## Docker Setup
1. Build and run: `docker-compose up --build`.
2. The API will be available at `http://localhost:3000`.


## API Endpoints
- `GET /health`: Health check.
- `GET /users`: List users.
- `POST /users`: Create user.
- `POST /auth/login`: Authenticate and receive JWT tokens.
- `POST /auth/refresh`: Refresh JWT access tokens.
- `POST /proposals`: Create proposal.
- `POST /proposals/:id/vote`: Cast QV vote.
- `POST /proposals/:id/contribute`: Crowdfund contribution (supports Multi-token `tokenSymbol` body param).
- `GET /api/governance/security-metrics`: Get advanced Sybil and platform health metrics.
- `POST /api/governance/auto-generate-proposal`: Triggers AI to auto-generate a proposal based on engagement trends.

## Production Deployment (Phase 9: Global Scaling)
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
