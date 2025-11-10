// vehicle-marketplace/src/lib/api.js
//
// Frontend-only API helpers for the MVP.
// - No external systems for inventory.
// - Dummy inventory for search + VDP.
// - Fee analysis + total cost + shipping helpers.
// - Vehicle history stub (ready to swap for Carfax API).

//
// Dummy vehicles used for both search and VDP
//
export const DUMMY_VEHICLES = [
  {
    vin: "JM1BPBLL9M1300001",
    year: 2021,
    make: "Mazda",
    model: "Mazda3",
    trim: "Preferred",
    price: 20995,
    mileage: 24500,
    location: "San Rafael, CA",
    dealerName: "Marin Auto Group",
    dealerAddress: "456 Shoreline Blvd, San Rafael, CA 94901",
    dealerPhone: "(415) 555-0134",
    highlights: [
      "2021 Mazda Mazda3 Preferred",
      "24,500 miles",
      "Hatchback",
      "Automatic",
      "Deep Crystal Blue",
    ],
    description:
      "Clean Carfax Mazda3 Preferred with premium audio and safety tech. Includes reconditioning fee $695 and processing fee $199 disclosed in dealer comments.",
    photos: [
      "https://images.pexels.com/photos/4674338/pexels-photo-4674338.jpeg?auto=compress&w=1200",
      "https://images.pexels.com/photos/1149831/pexels-photo-1149831.jpeg?auto=compress&w=1200",
      "https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&w=1200",
    ],
  },
  {
    vin: "1G1RC6S56JU111701",
    year: 2018,
    make: "Chevrolet",
    model: "Volt",
    trim: "LT",
    price: 10994,
    mileage: 60025,
    location: "Bay Area, CA",
    dealerName: "SF EV Outlet",
    dealerAddress: "100 Market St, San Francisco, CA 94105",
    dealerPhone: "(415) 555-1000",
    highlights: ["Plug-in hybrid", "Bluetooth", "Backup camera"],
    description:
      "Dealer doc fee $395 and prep fee $295 may apply. Great commuter EV with HOV history.",
    photos: [
      "https://images.pexels.com/photos/305070/pexels-photo-305070.jpeg?auto=compress&w=1200",
    ],
  },
  // ... (trimmed for brevity—keep your other dummy vehicles here)
];

//
// Fee analysis
//
export function analyzeFees(text) {
  const src = (text || "").toLowerCase();
  const pickAmount = (re) => {
    const m = src.match(re);
    if (!m) return 0;
    const num = Number(m[1].replace(/,/g, ""));
    return Number.isFinite(num) ? num : 0;
  };

  let docFee = pickAmount(/doc(?:ument)?(?:ation)? fee[^$\d]*\$([\d,]+)/);
  let processingFee = pickAmount(/processing fee[^$\d]*\$([\d,]+)/);
  let reconFee = pickAmount(/reconditioning fee[^$\d]*\$([\d,]+)/);

  if (!docFee && /doc(?:ument)?(?:ation)? fee/.test(src)) docFee = 85;
  if (!processingFee && /processing fee/.test(src)) processingFee = 199;
  if (!reconFee && /reconditioning fee/.test(src)) reconFee = 595;

  let addons = 0;
  if (/market adjustment|protection package|etch|nitrogen/.test(src)) {
    addons += 695;
  }

  const taxRate = 0.095; // demo
  const dmvFee = 450; // demo

  return { docFee, processingFee, reconFee, addons, taxRate, dmvFee };
}

export function computeTotalWithFees(price, fees = {}, opts = {}) {
  const base = Number(price) || 0;

  const docFee = Number(fees.docFee || 0);
  const processingFee = Number(fees.processingFee || 0);
  const reconFee = Number(fees.reconFee || 0);
  const addons = Number(fees.addons || 0);

  const shipping = Number(
    fees.shipping ?? opts.shipping ?? 0
  );

  const taxRate =
    typeof fees.taxRate === "number"
      ? fees.taxRate
      : typeof opts.taxRate === "number"
      ? opts.taxRate
      : 0.095;

  const dmvFee =
    typeof fees.dmvFee === "number"
      ? fees.dmvFee
      : typeof opts.dmvFee === "number"
      ? opts.dmvFee
      : 450;

  const taxable = base + docFee + processingFee + reconFee + addons;
  const tax = Math.max(0, taxable * taxRate);

  const total =
    base + docFee + processingFee + reconFee + addons + tax + dmvFee + Math.max(0, shipping);

  return { price: base, docFee, processingFee, reconFee, addons, taxRate, tax, dmvFee, shipping: Math.max(0, shipping), total };
}

export function calculateShipping(distanceMiles) {
  const d = Number(distanceMiles);
  if (!Number.isFinite(d) || d <= 0) return 0;
  if (d <= 100) return 250;
  return 250 + (d - 100) * 2;
}

//
// Dummy search + fetch helpers
//
function matchQuery(v, qRaw) {
  if (!qRaw) return true;
  const q = qRaw.toLowerCase();
  const hay = [
    v.vin,
    v.year,
    v.make,
    v.model,
    v.trim,
    v.dealerName,
    v.location,
    ...(v.highlights || []),
    v.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export async function searchVehicles({ q = "", page = 1, pagesize = 20, dir = "asc" } = {}) {
  const all = DUMMY_VEHICLES.filter((v) => matchQuery(v, q));
  const sorted = [...all].sort((a, b) => (dir === "desc" ? (b.price || 0) - (a.price || 0) : (a.price || 0) - (b.price || 0)));
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pagesize));
  const start = (page - 1) * pagesize;
  const results = sorted.slice(start, start + pagesize);
  return { ok: true, query: { q, page, pagesize, dir }, count: results.length, total, totalPages, results };
}

export async function getVehicle(vin) {
  const v = DUMMY_VEHICLES.find((x) => String(x.vin).toLowerCase() === String(vin).toLowerCase());
  if (!v) return { ok: false, error: "Not found" };
  return { ok: true, vehicle: v };
}

//
// Vehicle history (stub for Carfax)
// Switch this implementation later to call the real Carfax API and return the same shape.
//
export async function getVehicleHistory(vin) {
  // Demo mock; vary lightly by VIN to keep things interesting
  const seed = (String(vin).charCodeAt(0) + String(vin).charCodeAt(1)) % 3;

  const owners = seed === 0 ? 1 : seed === 1 ? 2 : 3;
  const maintenance = 3 + seed;
  const events = seed; // e.g., minor incidents count
  const smog = seed !== 2 ? "Pass" : "Unknown";
  const inspection = seed !== 1 ? "Passed" : "Due soon";

  const all = [
    { date: "2021-03-02", type: "MAINTENANCE", text: "Oil and filter changed" },
    { date: "2022-10-18", type: "INSPECTION", text: "Annual safety inspection passed" },
    ...(seed === 2
      ? [{ date: "2020-07-11", type: "EVENT", text: "Minor damage reported (bumper) — no airbag deployment" }]
      : []),
    { date: "2023-08-20", type: "SMOG", text: "Emissions test passed" },
  ];

  return {
    ok: true,
    history: {
      owners,
      maintenance,
      events,
      smog,
      inspection,
      all,
    },
  };
}

const api = {
  searchVehicles,
  getVehicle,
  analyzeFees,
  computeTotalWithFees,
  calculateShipping,
  getVehicleHistory,
  DUMMY_VEHICLES,
};

export default api;
