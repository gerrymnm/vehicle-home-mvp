// vehicle-marketplace/src/lib/api.js
//
// Frontend-only API helpers for the MVP.
// - No external systems.
// - Dummy inventory for search + VDP.
// - Fee analysis + total cost + shipping helpers.

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
  },
  {
    vin: "1G1JG6SB1L4126021",
    year: 2020,
    make: "Chevrolet",
    model: "Sonic",
    trim: "LT 5-Door Fleet",
    price: 11594,
    mileage: 51773,
    location: "Oakland, CA",
    dealerName: "East Bay Motors",
    dealerAddress: "2500 Broadway, Oakland, CA 94612",
    dealerPhone: "(510) 555-0220",
    highlights: ["Hatchback", "Apple CarPlay", "Android Auto"],
    description: "No hidden add-ons. Standard doc fee $85 only.",
  },
  {
    vin: "1G1BD5SM6J7152084",
    year: 2018,
    make: "Chevrolet",
    model: "Cruze",
    trim: "LT",
    price: 12994,
    mileage: 46724,
    location: "San Jose, CA",
    dealerName: "South Bay Auto Plaza",
    dealerAddress: "900 Capitol Expy, San Jose, CA 95136",
    dealerPhone: "(408) 555-0330",
    highlights: ["Turbo", "Bluetooth", "One-owner"],
    description:
      "Includes $499 processing fee and $399 reconditioning fee listed below.",
  },
  {
    vin: "3C4PDCGBXLT265088",
    year: 2020,
    make: "Dodge",
    model: "Journey",
    trim: "Crossroad",
    price: 13594,
    mileage: 79394,
    location: "Sacramento, CA",
    dealerName: "Capital City Auto",
    dealerAddress: "321 Main St, Sacramento, CA 95814",
    dealerPhone: "(916) 555-0440",
    highlights: ["3rd-row seating", "Roof rails"],
    description:
      "Dealer documentation fee $399. Reconditioning fee $695. No other add-ons.",
  },
  {
    vin: "1GKKNKLA0HZ172549",
    year: 2017,
    make: "GMC",
    model: "Acadia",
    trim: "SLE",
    price: 14794,
    mileage: 85980,
    location: "Concord, CA",
    dealerName: "Delta Auto Group",
    dealerAddress: "800 Contra Costa Blvd, Concord, CA 94523",
    dealerPhone: "(925) 555-0550",
    highlights: ["Third row", "Bluetooth"],
    description:
      "Standard doc fee $85. No recon fee mentioned. Family SUV ready to go.",
  },
  {
    vin: "WVWPR7AU4KW905937",
    year: 2019,
    make: "Volkswagen",
    model: "e-Golf",
    trim: "SEL Premium",
    price: 17988,
    mileage: 60999,
    location: "Berkeley, CA",
    dealerName: "Green Line EVs",
    dealerAddress: "2020 University Ave, Berkeley, CA 94704",
    dealerPhone: "(510) 555-0660",
    highlights: ["All-electric", "Navigation", "Heated seats"],
    description:
      "Clean EV. Dealer doc fee $395. Market adjustment or protection packages not required.",
  },
  {
    vin: "JTJBARBZ6G2095696",
    year: 2016,
    make: "Lexus",
    model: "NX",
    trim: "200t",
    price: 19494,
    mileage: 95269,
    location: "Walnut Creek, CA",
    dealerName: "Premium Select Motors",
    dealerAddress: "1500 N Main St, Walnut Creek, CA 94596",
    dealerPhone: "(925) 555-0770",
    highlights: ["Luxury", "AWD"],
    description:
      "Luxury SUV. Dealer processing fee $399 and optional protection package $695.",
  },
];

//
// Fee analysis
//

// Very lightweight keyword/amount parser for demo purposes.
export function analyzeFees(text) {
  const src = (text || "").toLowerCase();
  const pickAmount = (re) => {
    const m = src.match(re);
    if (!m) return 0;
    const num = Number(m[1].replace(/,/g, ""));
    return Number.isFinite(num) ? num : 0;
  };

  // Try to detect specific fees
  let docFee = pickAmount(/doc(?:ument)?(?:ation)? fee[^$\d]*\$([\d,]+)/);
  let processingFee = pickAmount(/processing fee[^$\d]*\$([\d,]+)/);
  let reconFee = pickAmount(/reconditioning fee[^$\d]*\$([\d,]+)/);

  // If mentioned but no explicit number, plug in conservative demo defaults
  if (!docFee && /doc(?:ument)?(?:ation)? fee/.test(src)) docFee = 85;
  if (!processingFee && /processing fee/.test(src)) processingFee = 199;
  if (!reconFee && /reconditioning fee/.test(src)) reconFee = 595;

  // Generic “packages / add-ons” catch
  let addons = 0;
  if (/market adjustment|protection package|etch|nitrogen/.test(src)) {
    addons += 695;
  }

  // Demo tax + DMV assumptions (can be overridden in computeTotalWithFees opts)
  const taxRate = 0.095; // 9.5%
  const dmvFee = 450;

  return {
    docFee,
    processingFee,
    reconFee,
    addons,
    taxRate,
    dmvFee,
  };
}

// Compute full out-the-door given price + fees (+ optional shipping)
export function computeTotalWithFees(price, fees = {}, opts = {}) {
  const base = Number(price) || 0;

  const docFee = Number(fees.docFee || 0);
  const processingFee = Number(fees.processingFee || 0);
  const reconFee = Number(fees.reconFee || 0);
  const addons = Number(fees.addons || 0);

  const shipping = Number(
    fees.shipping ??
      opts.shipping ??
      0
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

  // For demo: tax applies to vehicle + dealer fees, not shipping
  const taxable = base + docFee + processingFee + reconFee + addons;
  const tax = Math.max(0, taxable * taxRate);

  const total =
    base +
    docFee +
    processingFee +
    reconFee +
    addons +
    tax +
    dmvFee +
    Math.max(0, shipping);

  return {
    price: base,
    docFee,
    processingFee,
    reconFee,
    addons,
    taxRate,
    tax,
    dmvFee,
    shipping: Math.max(0, shipping),
    total,
  };
}

//
// Shipping calculator used on VDP + for “Buy Online”
//

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

export async function searchVehicles({
  q = "",
  page = 1,
  pagesize = 20,
  dir = "asc",
} = {}) {
  const all = DUMMY_VEHICLES.filter((v) => matchQuery(v, q));

  const sorted = [...all].sort((a, b) => {
    if (dir === "desc") return (b.price || 0) - (a.price || 0);
    return (a.price || 0) - (b.price || 0);
  });

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pagesize));
  const start = (page - 1) * pagesize;
  const results = sorted.slice(start, start + pagesize);

  return {
    ok: true,
    query: { q, page, pagesize, dir },
    count: results.length,
    total,
    totalPages,
    results,
  };
}

export async function getVehicle(vin) {
  const v = DUMMY_VEHICLES.find(
    (x) => String(x.vin).toLowerCase() === String(vin).toLowerCase()
  );
  if (!v) {
    return { ok: false, error: "Not found" };
  }
  return { ok: true, vehicle: v };
}

//
// Default export object to preserve existing import style
//
const api = {
  searchVehicles,
  getVehicle,
  analyzeFees,
  computeTotalWithFees,
  calculateShipping,
  DUMMY_VEHICLES,
};

export default api;
