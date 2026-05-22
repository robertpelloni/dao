# Project Structure & Libraries

## 1. Directory Layout

```text
/
├── frontend/           # React + Vite + Tailwind Frontend
│   ├── src/
│   │   ├── api/        # API Client (Axios)
│   │   ├── components/ # React UI Components
│   │   ├── hooks/      # Custom Hooks (useDashboard)
│   │   └── App.tsx     # Main Entry & Navigation
│   └── public/         # Static Assets
├── src/                # Backend TypeScript Engine
│   ├── api/            # Express REST Server
│   ├── cli/            # Simulation & Test Scripts
│   ├── core/           # Business Logic (QV, Delegation, Crowdfunding)
│   └── models/         # Data Models & SQLite Store
├── tests/              # Jest Unit Tests
├── Dockerfile          # Container Config
├── docker-compose.yml  # Multi-container Orchestration
├── VERSION.md          # Single Source of Truth for Versioning
└── VISION.md           # Philosophical & Strategic Vision
```

## 2. Libraries and Submodules

### Backend
- **better-sqlite3:** Chosen for its performance and simplicity in providing persistent storage without the overhead of a full RDBMS for a PoC.
- **express:** The industry standard for lightweight, modular API development in Node.js.
- **jest:** Selected for its robust testing environment and TypeScript support via `ts-jest`.
- **ts-node:** Allows running TypeScript directly, speeding up the development/simulation cycle.

### Frontend
- **React (v19):** Chosen for its component-based architecture and widespread adoption.
- **Vite:** The fastest modern build tool for frontend projects, significantly improving developer experience.
- **Tailwind CSS:** Enables rapid "Insanely Great" UI development with a utility-first approach.
- **Lucide React:** Provides a clean, consistent set of icons.
- **Axios:** A reliable, promise-based HTTP client for API communication.

## 3. Submodules
*Currently, no external git submodules are used. All logic is native to this repository to maintain a lightweight, dependency-minimal footprint.*

## 4. Environment & Deployment
- **Node.js (v20+):** Primary runtime.
- **Docker:** Recommended for production-parity development and easy deployment.
- **SQLite:** Local file-based database (`dao.db`).
