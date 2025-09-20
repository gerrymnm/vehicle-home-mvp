// Conversational parser + simple relevance fallback.
//
// 1) Extract structured filters from natural text.
// 2) If strict filter returns no matches, use a fuzzy token score.
// 3) Price/year constraints are still respected in the fallback.

export function parseQueryToFilters(q) {
  const t = (q || "").toLowerCase();

  const filters = {
    make: null,
    model: null,
    type: null,   // suv | sedan | truck
    fuel: null,   // electric | hybrid | gas
    yearMin: null,
    yearMax: null,
    priceMin: null,
    priceMax: null,
    vin: null,
  };

  // VIN (loose 11–17 chars, excludes I O Q)
  const vinMatch = t.match(/\b([a-hj-npr-z0-9]{11,17})\b/);
  if (vinMatch) filters.vin = vinMatch[1].toUpperCase();

  // Price like "under $25k" or "below 20k"
  const under = t.match(/\b(under|below)\s*\$?\s*([0-9]+)\s*k?\b/);
  if (under) filters.priceMax = Number(under[2]) * 1000;

  // "over 15k"
  const over = t.match(/\bover\s*\$?\s*([0-9]+)\s*k?\b/);
  if (over) filters.priceMin = Number(over[1]) * 1000;

  // Year "2020+", "2019-2021"
  const plus = t.match(/\b(19|20)\d{2}\s*\+\b/);
  if (plus) filters.yearMin = Number(plus[0].replace("+", ""));

  const range = t.match(/\b((19|20)\d{2})\s*[-–]\s*((19|20)\d{2})\b/);
  if (range) {
    filters.yearMin = Number(range[1]);
    filters.yearMax = Number(range[3]);
  }

  const singleYear = t.match(/\b(19|20)\d{2}\b/);
  if (singleYear && !filters.yearMin && !filters.yearMax) {
    filters.yearMin = Number(singleYear[0]);
    filters.yearMax = Number(singleYear[0]);
  }

  // Body/type
  if (/\bsuv\b/.test(t)) filters.type = "suv";
  if (/\bsedan\b/.test(t)) filters.type = "sedan";
  if (/\btruck\b/.test(t)) filters.type = "truck";

  // Fuel
  if (/\belectric|ev\b/.test(t)) filters.fuel = "electric";
  if (/\bhybrid\b/.test(t)) filters.fuel = "hybrid";
  if (/\bgas|petrol\b/.test(t)) filters.fuel = "gas";

  // Make list
  const makes = [
    "honda",
    "mazda",
    "tesla",
    "ford",
    "toyota",
    "bmw",
    "audi",
    "hyundai",
  ];
  const foundMake = makes.find((m) => t.includes(m));
  if (foundMake) filters.make = foundMake;

  // Model: token after make (naive but works surprisingly well)
  if (filters.make) {
    const parts = t.split(/\s+/);
    const idx = parts.indexOf(filters.make);
    if (idx >= 0 && parts[idx + 1]) {
      const candidate = parts[idx + 1].replace(/[^a-z0-9\-]/g, "");
      if (candidate.length > 1) filters.model = candidate;
    }
  }

  return filters;
}

// Strict filter check (used first)
export function vehicleMatches(v, f) {
  if (f.vin && v.vin.toLowerCase() !== f.vin.toLowerCase()) return false;
  if (f.make && v.make.toLowerCase() !== f.make) return false;

  if (f.model) {
    const vm = v.model.toLowerCase().replace(/\s+/g, "");
    const fm = f.model.toLowerCase().replace(/\s+/g, "");
    if (vm !== fm) return false;
  }

  if (f.type && v.type.toLowerCase() !== f.type) return false;
  if (f.fuel && (v.fuel || "").toLowerCase() !== f.fuel) return false;

  if (f.yearMin && v.year < f.yearMin) return false;
  if (f.yearMax && v.year > f.yearMax) return false;

  if (f.priceMin && v.priceUsd < f.priceMin) return false;
  if (f.priceMax && v.priceUsd > f.priceMax) return false;

  return true;
}

// --------- Fallback fuzzy matching ----------

function tokens(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[^\w\s\-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function softScore(vehicle, q) {
  const qTokens = tokens(q);
  if (qTokens.length === 0) return 0;

  const hay = tokens(
    `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim} ${vehicle.type} ${vehicle.fuel} ${vehicle.location}`
  );

  let score = 0;
  for (const t of qTokens) {
    if (hay.includes(t)) score += 1;
  }
  // tiny bonuses
  if (vehicle.year) score += 0.1;
  if (vehicle.priceUsd) score += 0.1;

  return score;
}

export function softSearch(inventory, q, filters) {
  const scored = inventory
    .map((v) => ({ v, s: softScore(v, q) }))
    .filter(({ s }) => s > 0);

  // Respect price/year constraints if present
  const constrained = scored.filter(({ v }) => {
    if (filters.yearMin && v.year < filters.yearMin) return false;
    if (filters.yearMax && v.year > filters.yearMax) return false;
    if (filters.priceMin && v.priceUsd < filters.priceMin) return false;
    if (filters.priceMax && v.priceUsd > filters.priceMax) return false;
    return true;
  });

  constrained.sort((a, b) =>
    b.s !== a.s ? b.s - a.s : a.v.priceUsd - b.v.priceUsd
  );

  return constrained.map(({ v }) => v);
}
