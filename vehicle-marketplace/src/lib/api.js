// vehicle-marketplace/src/lib/api.js
// Pure front-end, in-memory demo API for the MVP marketplace.
// No external calls. All data is local dummy inventory.

/**
 * Vehicle shape:
 * {
 *   vin: string,
 *   year: number,
 *   make: string,
 *   model: string,
 *   trim?: string,
 *   price: number,
 *   mileage: number,
 *   condition: "New" | "Used",
 *   location: string,
 *   dealer: {
 *     name: string,
 *     address: string,
 *     city: string,
 *     state: string,
 *     zip: string,
 *     phone?: string,
 *   },
 *   photos: string[],
 *   color?: string,
 *   drivetrain?: string,
 *   bodyStyle?: string,
 *   transmission?: string,
 *   fuelType?: string,
 *   description: string,
 *   keywords?: string[],
 * }
 */

const STOCK_PHOTOS = {
  sedan:
    "https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&w=900",
  hatch:
    "https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&w=900",
  suv:
    "https://images.pexels.com/photos/119435/pexels-photo-119435.jpeg?auto=compress&w=900",
  truck:
    "https://images.pexels.com/photos/120049/pexels-photo-120049.jpeg?auto=compress&w=900",
  ev:
    "https://images.pexels.com/photos/112460/pexels-photo-112460.jpeg?auto=compress&w=900",
};

const DUMMY_VEHICLES = [
  {
    vin: "3MZBPACL4PM300002",
    year: 2023,
    make: "Mazda",
    model: "Mazda3",
    trim: "Select",
    price: 23950,
    mileage: 5800,
    condition: "Used",
    location: "Bay Area, CA",
    dealer: {
      name: "Sunrise Mazda",
      address: "123 Market St",
      city: "Oakland",
      state: "CA",
      zip: "94612",
      phone: "(510) 555-0123",
    },
    photos: [STOCK_PHOTOS.sedan, STOCK_PHOTOS.sedan],
    color: "Snowflake White Pearl",
    drivetrain: "FWD",
    bodyStyle: "Sedan",
    transmission: "Automatic",
    fuelType: "Gasoline",
    description:
      "One-owner 2023 Mazda3 Select with premium package. Dealer preparation fee $395 and documentation fee $85 not included in advertised price.",
    keywords: ["mazda", "mazda3", "select", "sunrise mazda"],
  },
  {
    vin: "JM1BPBLL9M1300001",
    year: 2021,
    make: "Mazda",
    model: "Mazda3",
    trim: "Preferred",
    price: 20995,
    mileage: 24500,
    condition: "Used",
    location: "Marin County, CA",
    dealer: {
      name: "Marin Auto Group",
      address: "456 Shoreline Blvd",
      city: "San Rafael",
      state: "CA",
      zip: "94901",
      phone: "(415) 555-0134",
    },
    photos: [STOCK_PHOTOS.hatch],
    color: "Deep Crystal Blue",
    drivetrain: "FWD",
    bodyStyle: "Hatchback",
    transmission: "Automatic",
    fuelType: "Gasoline",
    description:
      "Clean Carfax. Includes reconditioning fee $695 and processing fee $199 disclosed in dealer comments.",
    keywords: ["mazda", "mazda3", "preferred", "marin"],
  },
  {
    vin: "1G1RC6S56JU111701",
    year: 2018,
    make: "Chevrolet",
    model: "Volt",
    trim: "LT",
    price: 10994,
    mileage: 60025,
    condition: "Used",
    location: "Sacramento, CA",
    dealer: {
      name: "Capital City EV Outlet",
      address: "800 Greenway Dr",
      city: "Sacramento",
      state: "CA",
      zip: "95814",
      phone: "(916) 555-0101",
    },
    photos: [STOCK_PHOTOS.ev],
    bodyStyle: "Hatchback",
    drivetrain: "FWD",
    fuelType: "Plug-in Hybrid",
    transmission: "Automatic",
    description:
      "Affordable plug-in hybrid. Dealer doc fee $85 and electronic filing fee $30 apply at signing.",
    keywords: ["chevy", "chevrolet", "volt", "ev", "plug-in"],
  },
  {
    vin: "1G1JG6SB1L4126021",
    year: 2020,
    make: "Chevrolet",
    model: "Sonic",
    trim: "LT 5-Door Fleet",
    price: 11594,
    mileage: 51773,
    condition: "Used",
    location: "San Jose, CA",
    dealer: {
      name: "Valley Budget Motors",
      address: "900 Airport Pkwy",
      city: "San Jose",
      state: "CA",
      zip: "95110",
    },
    photos: [STOCK_PHOTOS.hatch],
    bodyStyle: "Hatchback",
    drivetrain: "FWD",
    fuelType: "Gasoline",
    transmission: "Automatic",
    description:
      "Great commuter hatch. Prep fee $295 and safety inspection fee $120 mentioned in dealer notes.",
    keywords: ["chevrolet", "sonic", "lt"],
  },
  {
    vin: "3C4PDCGBXLT265088",
    year: 2020,
    make: "Dodge",
    model: "Journey",
    trim: "Crossroad",
    price: 13594,
    mileage: 79394,
    condition: "Used",
    location: "Fresno, CA",
    dealer: {
      name: "Central Valley Auto Plaza",
      address: "1200 Freeway Dr",
      city: "Fresno",
      state: "CA",
      zip: "93722",
    },
    photos: [STOCK_PHOTOS.suv],
    bodyStyle: "SUV",
    drivetrain: "FWD",
    fuelType: "Gasoline",
    transmission: "Automatic",
    description:
      "Third-row seating. Dealer processing fee $199 extra. No prep add-ons.",
    keywords: ["dodge", "journey", "crossroad", "suv"],
  },
  {
    vin: "1GKKNKLA0HZ172549",
    year: 2017,
    make: "GMC",
    model: "Acadia",
    trim: "SLE",
    price: 14794,
    mileage: 85980,
    condition: "Used",
    location: "Oakland, CA",
    dealer: {
      name: "Sunrise Mazda (Used Superstore)",
      address: "1300 Market St",
      city: "Oakland",
      state: "CA",
      zip: "94612",
    },
    photos: [STOCK_PHOTOS.suv],
    bodyStyle: "SUV",
    drivetrain: "FWD",
    fuelType: "Gasoline",
    transmission: "Automatic",
    description:
      "Well maintained. Reconditioning fee $495 listed in dealer comments.",
    keywords: ["gmc", "acadia", "sle", "suv"],
  },
  {
    vin: "WVWPR7AU4KW905937",
    year: 2019,
    make: "Volkswagen",
    model: "e-Golf",
    trim: "SEL Premium",
    price: 17988,
    mileage: 60999,
    condition: "Used",
    location: "San Francisco, CA",
    dealer: {
      name: "City EV Direct",
      address: "200 Embarcadero",
      city: "San Francisco",
      state: "CA",
      zip: "94105",
    },
    photos: [STOCK_PHOTOS.ev],
    bodyStyle: "Hatchback",
    drivetrain: "FWD",
    fuelType: "Electric",
    transmission: "Single-speed",
    description:
      "Loaded EV hatch. Dealer prep $395 and doc fee $85 not included.",
    keywords: ["vw", "volkswagen", "egolf", "ev"],
  },
  {
    vin: "JTJBARBZ6G2095696",
    year: 2016,
    make: "Lexus",
    model: "NX",
    trim: "200t",
    price: 19494,
    mileage: 95269,
    condition: "Used",
    location: "Daly City, CA",
    dealer: {
      name: "Peninsula Luxury Motors",
      address: "500 Skyline Blvd",
      city: "Daly City",
      state: "CA",
      zip: "94015",
    },
    photos: [STOCK_PHOTOS.suv],
    bodyStyle: "SUV",
    drivetrain: "AWD",
    fuelType: "Gasoline",
    transmission: "Automatic",
    description:
      "Turbo AWD luxury. Dealer documentation fee $85 applies. No surprise add-ons.",
    keywords: ["lexus", "nx", "200t", "awd", "luxury"],
  },
  {
    vin: "4S4BSATC8K3332814",
    year: 2019,
    make: "Subaru",
    model: "Outback",
    trim: "2.5i Touring",
    price: 19894,
    mileage: 80299,
    condition: "Used",
    location: "Santa Rosa, CA",
    dealer: {
      name: "North Bay Subaru",
      address: "700 Redwood Hwy",
      city: "Santa Rosa",
      state: "CA",
      zip: "95401",
    },
    photos: [STOCK_PHOTOS.suv],
    bodyStyle: "Wagon",
    drivetrain: "AWD",
    fuelType: "Gasoline",
    transmission: "CVT",
    description:
      "Touring with Eyesight. Dealer adds protection package $595 and prep $295 (both shown as fees).",
    keywords: ["subaru", "outback", "touring", "awd"],
  },
  {
    vin: "3GCUKRERXHG418113",
    year: 2017,
    make: "Chevrolet",
    model: "Silverado 1500",
    trim: "LT",
    price: 20592,
    mileage: 144820,
    condition: "Used",
    location: "Modesto, CA",
    dealer: {
      name: "Central Truck Center",
      address: "400 Service Rd",
      city: "Modesto",
      state: "CA",
      zip: "95354",
    },
    photos: [STOCK_PHOTOS.truck],
    bodyStyle: "Truck",
    drivetrain: "4x4",
    fuelType: "Gasoline",
    transmission: "Automatic",
    description:
      "Work-ready 4x4. Reconditioning fee $695 and doc fee $85 disclosed.",
    keywords: ["chevy", "silverado", "truck", "4x4"],
  },
  {
    vin: "JF2SKARC3LH581099",
    year: 2020,
    make: "Subaru",
    model: "Forester",
    trim: "Sport",
    price: 21494,
    mileage: 73572,
    condition: "Used",
    location: "Berkeley, CA",
    dealer: {
      name: "Bayline Subaru",
      address: "1800 University Ave",
      city: "Berkeley",
      state: "CA",
      zip: "94703",
    },
    photos: [STOCK_PHOTOS.suv],
    bodyStyle: "SUV",
    drivetrain: "AWD",
    fuelType: "Gasoline",
    transmission: "CVT",
    description:
      "Sport trim in orange accents. Dealer prep $295, doc $85 extra.",
    keywords: ["subaru", "forester", "sport", "awd"],
  },
  {
    vin: "KL77LFEP7SC344700",
    year: 2025,
    make: "Chevrolet",
    model: "Trax",
    trim: "LS",
    price: 21895,
    mileage: 12,
    condition: "New",
    location: "Oakland, CA",
    dealer: {
      name: "Sunrise Chevy",
      address: "1400 Market St",
      city: "Oakland",
      state: "CA",
      zip: "94612",
    },
    photos: [STOCK_PHOTOS.suv],
    bodyStyle: "SUV",
    drivetrain: "FWD",
    fuelType: "Gasoline",
    transmission: "Automatic",
    description:
      "All-new Trax LS. Advertised price excludes doc fee $85 and optional protection packages.",
    keywords: ["chevy", "trax", "new"],
  },
  {
    vin: "2C3CDXHGXMH657079",
    year: 2021,
    make: "Dodge",
    model: "Charger",
    trim: "GT RWD",
    price: 22894,
    mileage: 58717,
    condition: "Used",
    location: "Concord, CA",
    dealer: {
      name: "East Bay Performance Auto",
      address: "600 Main St",
      city: "Concord",
      state: "CA",
      zip: "94520",
    },
    photos: [STOCK_PHOTOS.sedan],
    bodyStyle: "Sedan",
    drivetrain: "RWD",
    fuelType: "Gasoline",
    transmission: "Automatic",
    description:
      "Sporty GT with Blacktop package. Dealer processing fee $199 and prep fee $395 apply.",
    keywords: ["dodge", "charger", "gt"],
  },
];

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function matchesQuery(vehicle, normQ) {
  if (!normQ) return true;
  const haystack = [
    vehicle.year,
    vehicle.make,
    vehicle.model,
    vehicle.trim,
    vehicle.vin,
    vehicle.location,
    vehicle.dealer?.name,
    ...(vehicle.keywords || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(normQ);
}

// -------- Fee analysis --------

export function analyzeFees(description = "") {
  const text = String(description || "").toLowerCase();
  const fees = [];

  const patterns = [
    { key: "prep", label: "Preparation fee" },
    { key: "preparation", label: "Preparation fee" },
    { key: "processing", label: "Processing fee" },
    { key: "doc", label: "Documentation fee" },
    { key: "documentation", label: "Documentation fee" },
    { key: "reconditioning", label: "Reconditioning fee" },
    { key: "recon", label: "Reconditioning fee" },
    { key: "inspection", label: "Inspection fee" },
    { key: "protection", label: "Protection package" },
    { key: "package", label: "Dealer package" },
  ];

  const dollarRegex = /\$?\s*([0-9]{2,3}(?:,[0-9]{3})*|[1-9][0-9]{2,})/g;
  let match;

  while ((match = dollarRegex.exec(text))) {
    const raw = match[1];
    const amount = Number(raw.replace(/,/g, ""));
    if (!amount || amount <= 0) continue;
    const idx = match.index;
    const windowStart = Math.max(0, idx - 40);
    const windowEnd = idx + 40;
    const snippet = text.slice(windowStart, windowEnd);
    const pattern = patterns.find((p) => snippet.includes(p.key));
    if (pattern) {
      fees.push({ label: pattern.label, amount });
    }
  }

  const unique = [];
  const seen = new Set();
  for (const f of fees) {
    const key = `${f.label}:${f.amount}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(f);
    }
  }
  return unique;
}

export function computeTotalWithFees(basePrice, fees = []) {
  const safeBase = Number(basePrice) || 0;
  const extra = (fees || []).reduce(
    (sum, f) => sum + (Number(f.amount) || 0),
    0
  );
  return safeBase + extra;
}

// -------- Shipping calculator --------

export function calculateShipping(distanceMiles) {
  const d = Number(distanceMiles);
  if (!d || d <= 0) return 0;
  if (d <= 100) return 250;
  return 250 + 2 * (d - 100);
}

// -------- Public API functions --------

export async function searchVehicles({
  q = "",
  page = 1,
  pagesize = 20,
  dir = "asc",
} = {}) {
  await delay();

  const normQ = (q || "").toString().trim().toLowerCase();
  let items = DUMMY_VEHICLES.filter((v) => matchesQuery(v, normQ));

  items.sort((a, b) =>
    dir === "desc" ? b.price - a.price : a.price - b.price
  );

  const total = items.length;
  const safePage = Math.max(1, Number(page) || 1);
  const safeSize = Math.max(1, Number(pagesize) || 20);
  const start = (safePage - 1) * safeSize;
  const slice = items.slice(start, start + safeSize);

  const results = slice.map((v) => {
    const fees = analyzeFees(v.description);
    const totalWithFees = computeTotalWithFees(v.price, fees);
    return { ...v, fees, totalWithFees };
  });

  return {
    ok: true,
    query: { q, page: safePage, pagesize: safeSize, dir },
    results,
    count: results.length,
    total,
    totalPages: Math.max(1, Math.ceil(total / safeSize)),
  };
}

export async function getVehicle(vin) {
  await delay();
  const v = DUMMY_VEHICLES.find((x) => x.vin === vin);
  if (!v) {
    throw new Error("Not found");
  }
  const fees = analyzeFees(v.description);
  const totalWithFees = computeTotalWithFees(v.price, fees);
  return { ok: true, vehicle: { ...v, fees, totalWithFees } };
}

export async function listAllVehicles() {
  await delay();
  const results = DUMMY_VEHICLES.map((v) => {
    const fees = analyzeFees(v.description);
    const totalWithFees = computeTotalWithFees(v.price, fees);
    return { ...v, fees, totalWithFees };
  });
  return { ok: true, results };
}

// default export not strictly needed but kept if any legacy imports exist
const api = {
  searchVehicles,
  getVehicle,
  listAllVehicles,
  analyzeFees,
  computeTotalWithFees,
  calculateShipping,
};
export default api;
