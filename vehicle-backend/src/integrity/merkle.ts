// Minimal, browser-safe Merkle helpers for the demo.
// No external deps; keeps the UI from crashing if imported.

export type Hash = string;

/** SHA-256 for strings, with a tiny fallback if SubtleCrypto is unavailable. */
export async function sha256(input: string): Promise<Hash> {
  // Browser crypto
  // @ts-ignore
  const subtle = typeof window !== "undefined" && window.crypto?.subtle;
  if (subtle) {
    const enc = new TextEncoder().encode(input);
    const buf = await subtle.digest("SHA-256", enc);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // Tiny non-crypto fallback (OK for demo only)
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `fallback-${(hash >>> 0).toString(16)}`;
}

export async function hashJson(obj: unknown): Promise<Hash> {
  const canonical = JSON.stringify(obj);
  return sha256(canonical);
}

/** Build a simple Merkle root (order-independent) */
export async function buildMerkleRoot(items: unknown[]): Promise<Hash> {
  if (!items || items.length === 0) return sha256("");
  let layer: Hash[] = await Promise.all(items.map(hashJson));
  while (layer.length > 1) {
    const next: Hash[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const a = layer[i];
      const b = layer[i + 1] ?? layer[i]; // duplicate last when odd
      // Order-independent pair
      const pair = [a, b].sort().join("");
      // eslint-disable-next-line no-await-in-loop
      next.push(await sha256(pair));
    }
    layer = next;
  }
  return layer[0];
}

/** Placeholder verifier (not building full proofs in the MVP) */
export async function verifyInRoot(item: unknown, root: Hash): Promise<boolean> {
  // For demo, consider a single-item tree equivalent
  const h = await hashJson(item);
  return h === root;
}
