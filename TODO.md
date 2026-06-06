# TODO LIST - LiquidGov Phase 7 (Infrastructure & Scale)

### High Priority (Codebase Refinement)
- [ ] **SQL Query Optimization**: Replace simple Store loops in `SecurityEngine` with direct SQL joins for circular delegation detection.
- [ ] **Async Protocol Transition**: Migrate `RepositoryManager` methods to `async/await` to improve non-blocking server performance.
- [ ] **Error Boundary Coverage**: Implement React error boundaries for the Health Dashboard to handle API timeouts gracefully.

### Infrastructure & Operations
- [ ] **Parity**: Finalize Windows `.bat` equivalents for all new bash scripts (`deploy.sh`, `verify-docs.sh`).
- [ ] **CI Cache**: Implement GitHub Actions caching for `node_modules` to speed up the Verification job.
- [ ] **Staging Hardening**: Add automated rollback logic to `scripts/deploy.sh` if staging health checks fail.

### Future Backlog
- [ ] **Scalability**: Investigate client-side SNARK generation performance on mobile browsers.
- [ ] **Constitution**: implement programmatic "Execution Guards" for state-machine transitions based on the values in `CONSTITUTION.md`.
