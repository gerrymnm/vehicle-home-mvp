export async function uploadImage(file) {
  const jwt = import.meta.env.VITE_PINATA_JWT || "";
  if (!jwt) throw new Error("Missing VITE_PINATA_JWT");
  const fd = new FormData();
  fd.append("file", file);
  const r = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: fd,
  });
  if (!r.ok) throw new Error("Upload failed");
  const j = await r.json();
  const cid = j?.IpfsHash || j?.cid || "";
  if (!cid) throw new Error("No CID");
  return { cid, url: `https://gateway.pinata.cloud/ipfs/${cid}` };
}
