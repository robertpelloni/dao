import { ZKPManager } from '../src/core/zkp';

describe('ZKP Identity Layer (Semaphore)', () => {
  const zkp = new ZKPManager();

  it('should create an identity and prove membership', async () => {
    const identity = zkp.createIdentity('test-seed');
    const commitment = identity.commitment;

    zkp.addMember(commitment);

    const signal = '1'; // e.g., a vote 'FOR'
    const externalNullifier = 'proposal-123';

    const proof = await zkp.prove(identity, signal, externalNullifier);
    expect(proof).toBeDefined();
    expect(proof.merkleTreeRoot).toBe(zkp.getGroupRoot());

    const isValid = await zkp.verify(proof);
    expect(isValid).toBe(true);
  });
});
