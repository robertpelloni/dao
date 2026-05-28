# DEPLOYMENT

## CI/CD Pipeline
LiquidGov uses a GitHub Actions-based CI/CD pipeline (`.github/workflows/autopilot.yml`) that automates the following steps:
1. **Verify**: Lints code, verifies documentation standards, and performs a security audit (`npm audit`).
2. **Test**: Runs the full backend and frontend test suites.
3. **Build**: Compiles the backend TypeScript and builds the frontend Vite application.
4. **Docker-Verify**: Builds a Docker image and performs a health check in a staging environment.
5. **Deploy**: Automatically synchronizes branches via the Executive Protocol and stages deployment artifacts.

## Development Setup
1. Clone the repository.
2. Install dependencies: `npm install`.
3. Run simulation: `npx ts-node src/cli/simulate.ts`.
4. Run API server: `npx ts-node src/api/server.ts`.

## Local Build & Deployment
- To build the project locally: `bash scripts/build.sh`
- To simulate a deployment: `bash scripts/deploy.sh`

## Docker Setup
1. Build and run: `docker-compose up --build`.
2. The API will be available at `http://localhost:3000`.

## API Endpoints
- `GET /health`: Health check (returns version and status).
- `GET /summary`: Quick overview of user, proposal, and committee counts.
- `GET /users`: List users.
- `POST /users`: Create user.
- `POST /proposals`: Create proposal.
- `POST /proposals/:id/vote`: Cast QV vote.
- `POST /proposals/:id/contribute`: Crowdfund contribution.

## Staging Verification
The project includes a `docker-compose.staging.yml` for verifying the application behavior in a containerized environment similar to production.
