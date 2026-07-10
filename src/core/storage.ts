/**
 * Decentralized Storage Provider Interface
 */

export interface StorageProvider {
  /**
   * Uploads data and returns a content-addressed CID or hash.
   */
  upload(data: any): Promise<string>;

  /**
   * Retrieves data from a CID or hash.
   */
  retrieve(cid: string): Promise<any>;
}

/**
 * Mock IPFS Provider for Sandbox/Demo
 */
export class MockIPFSProvider implements StorageProvider {
  private vault: Map<string, any> = new Map();

  async upload(data: any): Promise<string> {
    const json = JSON.stringify(data);
    // Simple mock hash (CID-like)
    const hash = `Qm${Buffer.from(json).toString('base64').substring(0, 44)}`;
    this.vault.set(hash, data);
    console.log(`[MOCK IPFS] Data uploaded to CID: ${hash}`);
    return hash;
  }

  async retrieve(cid: string): Promise<any> {
    return this.vault.get(cid);
  }
}

export const globalStorage = new MockIPFSProvider();
