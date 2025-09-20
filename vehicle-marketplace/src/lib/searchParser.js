// very small, friendly parser for natural queries like:
// "2020-2022 Toyota SUVs under 30k near San Jose with AWD"
// "low mileage Honda Accord under 20k within 50 miles"

const MAKES = ["toyota","honda","mazda","ford","chevrolet","tesla","bmw","audi","mercedes","hyundai","kia","volkswagen","subaru","nissan","jeep","ram"];
const FUELS = ["hybrid","electric","ev","gas","diesel"];

export function parseQuery(raw) {
  const q = (raw || "").toLowerCase();
  const out = { raw };

  // make / model (simple)
  for (const make of MAKES) {
    if (q.includes(make)) {
      out.make = make;
      break;
    }
  }
  // model = next token after make (very naive)
  if (out.make) {
    const parts = q.split(/\s+/);
    const i = parts.indexOf(out.make);
    if (i >= 0 && parts[i + 1]) {
      const m = parts[i + 1].replace(/[^a-z0-9]/g, "");
      if (m && !FUELS.includes(m) && !/^\d+$/.test(m)) out.model = m;
    }
  }

  // year range
  const yearRange = q.match(/(19|20)\d{2}\s*[-–to]+\s*(19|20)\d{2}/);
  if (yearRange) {
    const [a, b] = yearRange[0].split(/[-–to]+/).map((s) => parseInt(s, 10));
    out.minYear = Math.min(a, b);
    out.maxYear = Math.max(a, b);
  } else {
    const singleYear = q.match(/(19|20)\d{2}/);
    if (singleYear) {
      const y = parseInt(singleYear[0], 10);
      out.minYear = y;
      out.maxYear = y;
    }
  }

  // price like "under 30k", "≤ 25000"
  const priceK = q.match(/under\s+(\d+)\s*k/);
  if (priceK) out.maxPrice = parseInt(priceK[1], 10) * 1000;
  const priceNum = q.match(/under\s+(\d{4,6})/);
  if (priceNum) out.maxPrice = parseInt(priceNum[1], 10);

  // mileage like "under 60k miles"
  const milesK = q.match(/under\s+(\d+)\s*k\s*miles/);
  if (milesK) out.maxMiles = parseInt(milesK[1], 10) * 1000;

  // fuel
  for (const f of FUELS) {
    if (q.includes(f)) {
      out.fuel = f === "ev" ? "electric" : f;
      break;
    }
  }

  // near (very lightweight: capture after "near" or ZIP-like)
  const near = q.match(/near\s+([a-z0-9\s]+)/);
  if (near) out.near = near[1].trim();
  const zip = q.match(/\b(\d{5})(?:-\d{4})?\b/);
  if (zip) out.near = zip[1];

  // features (awds, sunroof… just split “with …”)
  const withIdx = q.indexOf("with ");
  if (withIdx >= 0) {
    const tail = q.slice(withIdx + 5).split(/,|and/).map(s => s.trim()).filter(Boolean);
    if (tail.length) out.features = tail.map(t => t.replace(/[^a-z0-9\s]/g,"").trim());
  }

  return out;
}
