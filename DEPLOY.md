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

## Production Deployment
(To be determined as the architecture evolves)
