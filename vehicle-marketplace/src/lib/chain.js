// src/lib/chain.js
import { ethers } from "ethers";

// Minimal ABI (matches your VehicleRegistry.sol getters)
const ABI = [
  "function getRecordCount(string vin) external view returns (uint256)",
  "function getRecord(string vin, uint256 index) external view returns (string vin, string ipfsCid, bytes32 dataHash, uint256 timestamp, address sender)"
];

// Utility to format timestamp
export const tsToISO = (ts) =>
  new Date(Number(ts) * 1000).toISOString().replace(".000Z","Z");

// Fetch on-chain history + associated IPFS JSONs
export async function fetchVehicleHistory(vin) {
  const rpc = import.meta.env.VITE_ALCHEMY_URL;
  const addr = import.meta.env.VITE_CONTRACT_ADDRESS;
  if (!rpc || !addr) throw new Error("Missing VITE_ALCHEMY_URL / VITE_CONTRACT_ADDRESS");

  const provider = new ethers.JsonRpcProvider(rpc);
  const contract = new ethers.Contract(addr, ABI, provider);

  const count = await contract.getRecordCount(vin);
  const records = [];

  for (let i = 0; i < Number(count); i++) {
    const r = await contract.getRecord(vin, i);
    const rec = {
      vin: r[0],
      cid: r[1],
      hash: r[2],
      timestamp: Number(r[3]),
      sender: r[4],
      gateway: r[1] ? `https://ipfs.io/ipfs/${r[1]}` : null,
      json: null,
      jsonOk: false
    };
    // Try to pull JSON from IPFS if present
    if (rec.gateway) {
      try {
        const res = await fetch(rec.gateway, { cache: "no-store" });
        if (res.ok) {
          rec.json = await res.json();
          rec.jsonOk = true;
        }
      } catch { /* ignore */ }
    }
    records.push(rec);
  }

  // newest first
  records.sort((a,b) => b.timestamp - a.timestamp);
  return { count: Number(count), records };
}
