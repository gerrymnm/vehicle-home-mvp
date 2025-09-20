#!/usr/bin/env node
/**
 * Vehicle Home CLI (Sepolia) — Pinata + photos + events
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const axios = require("axios");
const FormData = require("form-data");
const { ethers } = require("ethers");
require("dotenv").config();

const {
  ALCHEMY_API_URL,
  PRIVATE_KEY,
  CONTRACT_ADDRESS,
  PINATA_JWT, // from Pinata (JWT)
} = process.env;

if (!ALCHEMY_API_URL || !PRIVATE_KEY || !CONTRACT_ADDRESS || !PINATA_JWT) {
  console.error("❌ Missing env vars. Need ALCHEMY_API_URL, PRIVATE_KEY, CONTRACT_ADDRESS, PINATA_JWT in .env");
  process.exit(1);
}

const ABI = [
  "function addRecord(string vin, string ipfsCid, bytes32 dataHash) external",
  "function getRecordCount(string vin) external view returns (uint256)",
  "function getRecord(string vin, uint256 index) external view returns (string,string,bytes32,uint256,address)"
];

// ---------- ARG PARSER ----------
function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const k = args[i];
    if (k.startsWith("--")) {
      const key = k.replace(/^--/, "");
      const val = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : true;
      out[key] = val;
    }
  }
  return out;
}

// ---------- HELPERS ----------
const sha256Hex0x = (data) =>
  "0x" + crypto.createHash("sha256").update(data).digest("hex");

async function pinJSONToIPFS(json, name = "vehicle-home-snapshot") {
  const url = "https://api.pinata.cloud/pinning/pinJSONToIPFS";
  const res = await axios.post(
    url,
    { pinataContent: JSON.parse(json), pinataMetadata: { name } },
    { headers: { Authorization: `Bearer ${PINATA_JWT}` } }
  );
  return res.data.IpfsHash; // CID
}

async function pinFilesToIPFS(filePaths) {
  if (!filePaths || filePaths.length === 0) return [];
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
  const form = new FormData();

  // Add each file
  filePaths.forEach((p) => {
    const full = path.resolve(p.trim());
    form.append("file", fs.createReadStream(full), { filepath: path.basename(full) });
  });

  const res = await axios.post(url, form, {
    maxBodyLength: Infinity,
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
      ...form.getHeaders(),
    },
  });

  // When uploading multiple files, Pinata returns a “root” folder CID.
  // But we want individual file CIDs. Easiest way: upload one by one:
  // So if you want *individual* CIDs, do them sequentially:
  return filePaths.map((p) => path.basename(p)); // placeholder (see below)
}

// Upload photos one-by-one to get individual CIDs
async function pinEachPhoto(filePaths) {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
  const out = [];
  for (const p of (filePaths || [])) {
    const full = path.resolve(p.trim());
    const form = new FormData();
    form.append("file", fs.createReadStream(full), { filepath: path.basename(full) });

    const res = await axios.post(url, form, {
      maxBodyLength: Infinity,
      headers: { Authorization: `Bearer ${PINATA_JWT}`, ...form.getHeaders() },
    });

    out.push({ cid: res.data.IpfsHash, filename: path.basename(full) });
  }
  return out;
}

// ---------- SNAPSHOT BUILDER ----------
function buildSnapshot(opts, photoEntries) {
  const nowISO = new Date().toISOString();

  // Event type
  // Allowed examples: inspection, recondition, price_change, listed_for_sale, sold
  const evtType = (opts.event_type || "listed_for_sale").toString();

  // Price block
  const priceObj =
    opts.price
      ? { price: Number(opts.price), currency: (opts.currency || "USD").toUpperCase() }
      : undefined;

  return {
    schema: "vehicle-home@0.2",
    vin: String(opts.vin || "5J6TF3H33CL003984"),
    owner_type: opts.owner_type || "Dealer",
    owner_name: opts.owner_name || "GERRY MOTORS",
    attributes: {
      year: opts.year ? Number(opts.year) : 2012,
      make: opts.make || "Honda",
      model: opts.model || "Crosstour",
      trim: opts.trim || "EX-L",
      mileage: opts.mileage ? Number(opts.mileage) : 110000,
      location: opts.location || "SOUTH SAN FRANCISCO, CA",
      ...(priceObj ? priceObj : {}),
      photos: photoEntries || [], // [{cid, filename}]
    },
    events: [
      {
        type: evtType,
        date: nowISO,
        metadata: {
          note: opts.note || "",
          // optional fields for certain event types
          // e.g. for inspection:
          // score: opts.score ? Number(opts.score) : undefined
          // for recondition:
          // work: opts.work || ""
          // for price_change:
          // old_price: opts.old_price ? Number(opts.old_price) : undefined
          // new_price: opts.price ? Number(opts.price) : undefined
        },
        source: "Vehicle Home CLI",
      },
    ],
  };
}

// ---------- MAIN ----------
async function main() {
  const a = parseArgs();

  // Parse photos: comma-separated paths
  const photoList = (a.photos || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Upload photos individually to get their CIDs
  let photoEntries = [];
  if (photoList.length) {
    console.log("🖼️  Uploading photos to IPFS via Pinata...");
    photoEntries = await pinEachPhoto(photoList);
    photoEntries.forEach((p, i) =>
      console.log(`   #${i} ${p.filename} → ${p.cid} → https://ipfs.io/ipfs/${p.cid}`)
    );
  }

  // Build JSON snapshot
  const snapshot = buildSnapshot(a, photoEntries);
  const json = JSON.stringify(snapshot, null, 2);

  // Local copy
  const outDir = path.join(process.cwd(), "snapshots");
  fs.mkdirSync(outDir, { recursive: true });
  const localPath = path.join(outDir, `${snapshot.vin}-${Date.now()}.json`);
  fs.writeFileSync(localPath, json, "utf-8");

  // Hash
  const hashHex = sha256Hex0x(json);

  // Upload JSON
  console.log("📦 Uploading JSON to IPFS via Pinata...");
  const cid = await pinJSONToIPFS(json, `vehicle-home-${snapshot.vin}`);
  console.log("✅ IPFS CID:", cid);
  console.log("🔗 Gateway:", `https://ipfs.io/ipfs/${cid}`);

  // Anchor on Sepolia
  console.log("⛓️  Anchoring on Sepolia...");
  const provider = new ethers.JsonRpcProvider(ALCHEMY_API_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  const tx = await contract.addRecord(snapshot.vin, cid, hashHex);
  console.log("📝 TX sent:", tx.hash);
  const rc = await tx.wait();
  console.log("✅ Mined in block:", rc.blockNumber);

  // Read-back
  const count = await contract.getRecordCount(snapshot.vin);
  const rec = await contract.getRecord(snapshot.vin, Number(count) - 1);

  console.log("\n🎉 STORED RECORD");
  console.log("VIN:        ", rec[0]);
  console.log("IPFS CID:   ", rec[1]);
  console.log("Data Hash:  ", rec[2]);
  console.log("Timestamp:  ", new Date(Number(rec[3]) * 1000).toISOString());
  console.log("Sender:     ", rec[4]);
  console.log("Local JSON: ", localPath);
}

main().catch((e) => {
  console.error("❌ Error:", e.response?.data || e.message || e);
  process.exit(1);
});
