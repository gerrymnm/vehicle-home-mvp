// No-op anchoring demo — prevents UI from failing if imported.
// Replace with real anchoring later.

export type AnchorReceipt = {
  txId: string;
  chain: "demo";
  timestamp: number;
};

export async function anchorToChain(_payload: unknown): Promise<AnchorReceipt> {
  return {
    txId: `demo-${Date.now()}`,
    chain: "demo",
    timestamp: Date.now(),
  };
}
