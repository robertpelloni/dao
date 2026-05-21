# DEPLOYMENT

## Development Setup
1. Clone the repository.
2. Install dependencies: `npm install`.
3. Run simulation: `npx ts-node src/cli/simulate.ts`.
4. Run API server: `npx ts-node src/api/server.ts`.

## API Endpoints
- `GET /health`: Health check.
- `GET /users`: List users.
- `POST /users`: Create user.
- `POST /proposals`: Create proposal.
- `POST /proposals/:id/vote`: Cast QV vote.
- `POST /proposals/:id/contribute`: Crowdfund contribution.

## Production Deployment
(To be determined as the architecture evolves)
