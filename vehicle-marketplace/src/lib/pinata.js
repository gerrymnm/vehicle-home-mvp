export async function pinFilesToIPFS(files) {
  const jwt = import.meta.env.VITE_PINATA_JWT;
  if (!jwt) throw new Error("Missing VITE_PINATA_JWT in .env");

  const form = new FormData();
  for (const f of files) form.append("file", f);

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${jwt}` },
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata upload failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  return [
    {
      cid: json.IpfsHash,
      url: `https://ipfs.io/ipfs/${json.IpfsHash}`,
      filename: files.length === 1 ? files[0].name : `${files.length} files`,
      size: files.reduce((a, b) => a + (b.size || 0), 0),
    },
  ];
}
