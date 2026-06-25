import { Identity } from "@semaphore-protocol/identity";
import { Group } from "@semaphore-protocol/group";
import { generateProof, verifyProof } from "@semaphore-protocol/proof";
import { generateProofOptimized, ZKPWorkerRequest } from "./zkp-worker";

export class ZKPManager {
  private group: Group;

  constructor() {
    this.group = new Group();
  }

  createIdentity(seed?: string): Identity {
    return new Identity(seed);
  }

  addMember(commitment: any): void {
    this.group.addMember(commitment);
  }

  async prove(identity: Identity, signal: string, externalNullifier: any): Promise<any> {
    // Standard synchronous proving
    return await generateProof(identity, this.group, externalNullifier, signal);
  }

  /**
   * Optimized asynchronous proving via Web Worker / Wasm Simulation
   */
  async proveOptimized(identitySeed: string, signal: string, externalNullifier: string): Promise<any> {
    const req: ZKPWorkerRequest = {
      identitySeed,
      members: this.group.members.map(m => m.toString()),
      externalNullifier,
      signal
    };

    const response = await generateProofOptimized(req);
    if (response.error) {
      throw new Error(`Optimized ZKP Generation failed: ${response.error}`);
    }

    return response.proof;
  }

  async verify(proof: any): Promise<boolean> {
    return await verifyProof(proof);
  }

  getGroupRoot(): string {
    return this.group.root.toString();
  }
}

export const globalZKP = new ZKPManager();
