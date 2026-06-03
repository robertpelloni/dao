import { RepositoryManager } from '../src/core/repository';
async function main() {
  const mgr = new RepositoryManager();
  mgr.initialize();
  mgr.syncUpstream();
  mgr.syncRoadmap();
  mgr.syncSubmoduleMap();
}
main();
