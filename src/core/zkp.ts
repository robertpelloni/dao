import { Identity } from "@semaphore-protocol/identity";
import { Group } from "@semaphore-protocol/group";
import { generateProof, verifyProof } from "@semaphore-protocol/proof";

export class ZKPManager {
  private group: Group;

  constructor() {
    this.group = new Group([], 5);
  }

  createIdentity(seed?: string): Identity {
    return new Identity(seed);
  }

  addMember(commitment: any): void {
    this.group.addMember(commitment);
  }

  async prove(identity: Identity, signal: string, externalNullifier: any): Promise<any> {
    return await generateProof(identity, this.group, externalNullifier, signal);
  }

  async verify(proof: any): Promise<boolean> {
    return await verifyProof(proof);
  }

  getGroupRoot(): string {
    return this.group.root.toString();
  }
}

export const globalZKP = new ZKPManager();
