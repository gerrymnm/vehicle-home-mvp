// src/lib/config.js
// Central place for envs & constants (kept out of UI)
export const CONTRACT_ADDRESS = "0xd458fe664215466d478ECa8434a067Ee221F0B06";

// You can point to any RPC; Alchemy is great. This keeps MetaMask optional for reads.
export const ALCHEMY_RPC = "https://eth-sepolia.g.alchemy.com/v2/H-D3draiGJ6jecEzCwv8F";

// Your Pinata JWT (client-side allowed by Pinata). Replace if you rotate keys.
export const PINATA_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJkYzRiYjI2ZS1lZjVlLTRhZjQtODcxZS1mMjFkNTFjMWU4MTEiLCJlbWFpbCI6ImdlcnJ5bW5tQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiIxODc4MzIzNjI0ZDgwZGZhZTRjZCIsInNjb3BlZEtleVNlY3JldCI6IjJiZDExNDAxMTBkMzRlMDE3Zjc2MzYzYzk2MDFmNDNiMjliOGVhNmZlOTBmYTE2NjU5MjBjMzY4YWZlMzBiMTkiLCJleHAiOjE3ODczOTA0NzR9.8ztOuMtze7xZgWtXzPUxpaP6jhpu8FIkof0OGF03W9k";

// Basic IPFS gateways
export const IPFS_HTTP = (cid) => `https://ipfs.io/ipfs/${cid}`;
export const IPFS_ALT = (cid) => `https://gateway.pinata.cloud/ipfs/${cid}`;
