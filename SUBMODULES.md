# Structural Map of Submodules

Currently, the LiquidGov project does not utilize external Git submodules. All logic for the Identity Layer, Committee Layer, Proposal Layer, and Quadratic Engine is implemented natively within the primary repository to ensure a lightweight and dependency-minimal footprint.

- **Main Repository:** `github.com/robertpelloni/dao`
- **Frontend:** Integrated React/Vite/Tailwind app in `/frontend`
- **Backend:** Node.js/TypeScript engine in `/src`

If submodules are added in the future (e.g., for specialized ZKP circuits or On-Chain hooks), they will be documented here with their remote URLs and tracking commits.
