# SUBMODULE MAP

## Current Status
As of version 1.0.1, LiquidGov (dao) utilizes a **Native Monorepo** architecture. There are currently no external Git submodules integrated into the project.

## Architectural Decision
To ensure maximum reliability and minimize dependency-related friction for the Autonomous Protocol, all core logic has been unified within the primary repository:

- **Frontend**: Located in `/frontend` (React + Vite + Tailwind).
- **Backend Core**: Located in `/src/core` (TypeScript).
- **API Server**: Located in `/src/api` (Express).
- **Data Layer**: Located in `/src/models` (SQLite).

## Future Considerations
If specialized, independently-versioned components (e.g., specific ZKP circuit libraries or multi-chain adapter hooks) are required, they may be introduced as submodules. Any such additions must be registered here with:
1. Remote URL
2. Target tracking commit/branch
3. Functional responsibility
