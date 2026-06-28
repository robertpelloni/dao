import { Store } from '../src/models/Store';
import { CrossChainBridge } from '../src/core/crossChainBridge';

describe('Cross-Chain Governance Bridge', () => {
  let store: Store;
  let bridge: CrossChainBridge;

  beforeEach(() => {
    store = new Store();
    bridge = new CrossChainBridge(store);
  });

  it('should fail if proposal is not completed', async () => {
    store.addProposal({
      id: 'prop-chain-1',
      title: 'Bridge Test',
      abstract: 'Test',
      detailedSpecs: 'Test',
      proposerId: 'user1',
      committeeId: 'comm1',
      status: 'FUNDED',
      milestones: [],
      totalTargetBudget: 1000,
      currentFunding: 1000,
      tokenSymbol: 'USD',
      votesFor: 0,
      votesAgainst: 0,
      executionPayload: '{"action":"transfer"}'
    });

    const result = await bridge.executeCrossChainPayload('prop-chain-1');
    expect(result.success).toBe(false);
    expect(result.error).toContain('must be fully completed');
  });

  it('should successfully execute a cross chain payload', async () => {
    store.addProposal({
      id: 'prop-chain-2',
      title: 'Bridge Test 2',
      abstract: 'Test',
      detailedSpecs: 'Test',
      proposerId: 'user1',
      committeeId: 'comm1',
      status: 'COMPLETED',
      milestones: [],
      totalTargetBudget: 1000,
      currentFunding: 1000,
      tokenSymbol: 'USD',
      votesFor: 0,
      votesAgainst: 0,
      executionPayload: '{"action":"transfer"}'
    });

    const result = await bridge.executeCrossChainPayload('prop-chain-2', 'optimism');
    expect(result.success).toBe(true);
    expect(result.txHash).toBeDefined();

    const updated = store.getProposal('prop-chain-2');
    const payload = JSON.parse(updated!.executionPayload);
    expect(payload.executedOn).toBe('optimism');
    expect(payload.txHash).toBe(result.txHash);
  });
});
