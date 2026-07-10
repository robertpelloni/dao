import re

with open('DEPLOY.md', 'r') as f:
    content = f.read()

endpoints = """
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
"""

content = re.sub(r"## API Endpoints.*?(?=## Production Deployment)", endpoints + "\n", content, flags=re.DOTALL)

with open('DEPLOY.md', 'w') as f:
    f.write(content)
