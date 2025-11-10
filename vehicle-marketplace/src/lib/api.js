// src/lib/api.js
// Frontend-only API: dummy inventory + pricing helpers for MVP

// ---------- Dummy data ----------

const vehicles = [
  {
    vin: "DUMMYMAZDA001",
    year: 2023,
    make: "Mazda",
    model: "CX-5",
    trim: "Preferred",
    price: 28950,
    mileage: 12450,
    location: "San Rafael, CA",
    dealer: {
      name: "Sunrise Mazda",
      address: "123 Main St, San Rafael, CA 94901",
      phone: "(415) 555-0123",
      email: "sales@sunrisemazda.com",
    },
    images: [
      "https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg",
      "https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg",
    ],
    // Intentionally contains add-on language for parsing demo
    description:
      "Dealer demo. Includes $799 preparation fee and $599 appearance package not included in advertised price. Doc fee $85 extra.",
    history: {
      owners: 1,
      accidents: 0,
      usage: "Personal",
      highlights: ["Clean title", "Regular oil changes"],
    },
  },
  {
    vin: "DUMMYVW001",
    year: 2019,
    make: "Volkswagen",
    model: "e-Golf",
    trim: "SEL Premium",
    price: 17988,
    mileage: 60999,
    location: "Oakland, CA",
    dealer: {
      name: "Bay City Autos",
      address: "456 Harbor Blvd, Oakland, CA 94607",
      phone: "(510) 555-0199",
      email: "sales@baycityautos.com",
    },
    images: [
      "https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg",
    ],
    description:
      "Price excludes $399 processing fee and optional $995 protection package.",
    history: {
      owners: 2,
      accidents: 0,
      usage: "Lease return",
      highlights: ["Low battery degradation", "Complete records available"],
    },
  },
];

// ---------- Fee parsing ----------

const FEE_PATTERNS = [
  { keys: ["preparation fee", "prep fee"], label: "Preparation Fee" },
  { keys: ["processing fee"], label: "Processing Fee" },
  { keys: ["doc fee", "documentation fee"], label: "Documentation Fee" },
  { keys: ["reconditioning fee", "recon fee"], label: "Reconditioning Fee" },
  { keys: ["appearance package"], label: "Appearance Package" },
  { keys: ["protection package"], label: "Protection Package" },
];

export function analyzeFees(description) {
  if (!description) return [];
  const fees = [];
  const lower = description.toLowerCase();

  for (const pattern of FEE_PATTERNS) {
    for (const key of pattern.keys) {
      const idx = lower.indexOf(key);
      if (idx === -1) continue;

      const snippet = description.slice(idx, idx + 80);
      const match = snippet.match(/\$?\s*([0-9]{2,6})/);
      const amount = match ? Number(match[1]) : null;

      // de-dupe by label
      if (!fees.some((f) => f.label === pattern.label && f.amount === amount)) {
        fees.push({ label: pattern.label, amount });
      }
    }
  }

  return fees;
}

export function computeTotalWithFees(basePrice, fees) {
  if (!basePrice) return null;
  const extra = (fees || [])
    .filter((f) => typeof f.amount === "number" && !Number.isNaN(f.amount))
    .reduce((sum, f) => sum + f.amount, 0);
  return basePrice + extra;
}

// ---------- Shipping for "Buy Online" ----------
// $250 flat for <=100 miles; $2/mi for every mile after that.

export function calculateShipping(miles) {
  const d = Number(miles);
  if (!Number.isFinite(d) || d <= 0) return null;
  if (d <= 100) return 250;
  return 250 + (d - 100) * 2;
}

// ---------- Dummy search & lookup ----------

export async function searchVehicles({ q = "", page = 1, pagesize = 20 } = {}) {
  const query = q.trim().toLowerCase();
  let filtered = vehicles;

  if (query) {
    filtered = vehicles.filter((v) => {
      const haystack = [
        v.vin,
        v.year,
        v.make,
        v.model,
        v.trim,
        v.location,
        v.dealer?.name,
        v.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }

  const start = (page - 1) * pagesize;
  const slice = filtered.slice(start, start + pagesize);

  return {
    ok: true,
    query: { q, page, pagesize },
    count: slice.length,
    total: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / pagesize)),
    results: slice,
  };
}

export async function getVehicle(vin) {
  const v = vehicles.find((x) => x.vin === vin);
  if (!v) throw new Error("Not found");
  const fees = analyzeFees(v.description);
  return {
    ok: true,
    vehicle: {
      ...v,
      fees,
      totalWithFees: computeTotalWithFees(v.price, fees),
    },
  };
}
