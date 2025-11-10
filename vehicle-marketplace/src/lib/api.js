// vehicle-marketplace/src/lib/api.js

// ---- Dummy inventory for MVP (frontend only) ----

const BASE_PHOTOS = [
  "https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&w=1200",
  "https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&w=1200",
  "https://images.pexels.com/photos/248747/pexels-photo-248747.jpeg?auto=compress&w=1200",
];

const DEALERS = {
  marin: {
    name: "Marin Auto Group",
    address: "456 Shoreline Blvd",
    city: "San Rafael",
    state: "CA",
    zip: "94901",
    phone: "(415) 555-0134",
  },
  bay: {
    name: "Bay City Motors",
    address: "1200 Market St",
    city: "Oakland",
    state: "CA",
    zip: "94607",
    phone: "(510) 555-0199",
  },
  coastal: {
    name: "Coastal EV & Hybrid",
    address: "88 Ocean Ave",
    city: "San Francisco",
    state: "CA",
    zip: "94112",
    phone: "(415) 555-0822",
  },
};

const RAW_VEHICLES = [
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
    bodyStyle: "Hatchback",
    drivetrain: "FWD",
    transmission: "Automatic",
    fuelType: "Gasoline",
    color: "Deep Crystal Blue",
    dealer: DEALERS.marin,
    photos: BASE_PHOTOS,
    description:
      "Clean Carfax Mazda3 Preferred with premium audio and safety tech. Includes reconditioning fee $695 and processing fee $199 disclosed in dealer comments.",
  },
  {
    vin: "3MZBPAEM1PM300002",
    year: 2023,
    make: "Mazda",
    model: "Mazda3",
    trim: "Select",
    price: 23950,
    mileage: 5800,
    condition: "Used",
    location: "Bay Area, CA",
    bodyStyle: "Sedan",
    drivetrain: "FWD",
    transmission: "Automatic",
    fuelType: "Gasoline",
    color: "Snowflake White",
    dealer: DEALERS.coastal,
    photos: BASE_PHOTOS,
    description:
      "Off-lease Mazda3 Select with Apple CarPlay and full safety suite. Dealer charges a documentation fee of $85.",
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
    location: "Bay Area, CA",
    bodyStyle: "Hatchback",
    drivetrain: "FWD",
    transmission: "Automatic",
    fuelType: "Plug-in Hybrid",
    color: "Silver Ice Metallic",
    dealer: DEALERS.coastal,
    photos: BASE_PHOTOS,
    description:
      "Volt LT with comfort package. Dealer lists a $495 prep fee and $199 processing fee.",
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
    location: "Bay Area, CA",
    bodyStyle: "Hatchback",
    drivetrain: "FWD",
    transmission: "Automatic",
    fuelType: "Gasoline",
    color: "Red Hot",
    dealer: DEALERS.bay,
    photos: BASE_PHOTOS,
    description:
      "Former fleet Sonic LT. No hidden add-ons mentioned. Straightforward pricing.",
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
    location: "Bay Area, CA",
    bodyStyle: "SUV",
    drivetrain: "FWD",
    transmission: "Automatic",
    fuelType: "Gasoline",
    color: "White",
    dealer: DEALERS.bay,
    photos: BASE_PHOTOS,
    description:
      "Journey Crossroad with third-row seating. Dealer notes a reconditioning fee $695.",
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
    location: "Marin County, CA",
    bodyStyle: "SUV",
    drivetrain: "FWD",
    transmission: "Automatic",
    fuelType: "Gasoline",
    color: "Gray",
    dealer: DEALERS.marin,
    photos: BASE_PHOTOS,
    description:
      "Great family SUV. Dealer mentions $395 protection package and $199 processing fee.",
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
    location: "San Rafael, CA",
    bodyStyle: "Hatchback",
    drivetrain: "FWD",
    transmission: "Automatic",
    fuelType: "Electric",
    color: "White",
    dealer: DEALERS.coastal,
    photos: BASE_PHOTOS,
    description:
      "All-electric e-Golf SEL Premium. No dealer add-on fees advertised.",
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
    location: "Bay Area, CA",
    bodyStyle: "SUV",
    drivetrain: "AWD",
    transmission: "Automatic",
    fuelType: "Gasoline",
    color: "Black",
    dealer: DEALERS.marin,
    photos: BASE_PHOTOS,
    description:
      "Lexus NX 200t AWD. Dealer lists a $995 appearance package; called out here as an add-on.",
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
    location: "Bay Area, CA",
    bodyStyle: "Wagon",
    drivetrain: "AWD",
    transmission: "CVT",
    fuelType: "Gasoline",
    color: "Green",
    dealer: DEALERS.bay,
    photos: BASE_PHOTOS,
    description:
      "Touring trim with EyeSight. Includes $499 prep fee mentioned in listing.",
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
    location: "Marin County, CA",
    bodyStyle: "Truck",
    drivetrain: "4WD",
    transmission: "Automatic",
    fuelType: "Gasoline",
    color: "Blue",
    dealer: DEALERS.marin,
    photos: BASE_PHOTOS,
    description:
      "Silverado LT 4x4. Dealer mentions doc fee $85; no big add-ons.",
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
    location: "Bay Area, CA",
    bodyStyle: "SUV",
    drivetrain: "AWD",
    transmission: "CVT",
    fuelType: "Gasoline",
    color: "Orange",
    dealer: DEALERS.coastal,
    photos: BASE_PHOTOS,
    description:
      "Forester Sport with panoramic roof. Listing notes a $395 prep fee and $199 processing fee.",
  },
  {
    vin: "KL77LFEP7SC344700",
    year: 2025,
    make: "Chevrolet",
    model: "Trax",
    trim: "LS",
    price: 21895,
    mileage: 15,
    condition: "New",
    location: "San Rafael, CA",
    bodyStyle: "SUV",
    drivetrain: "FWD",
    transmission: "Automatic",
    fuelType: "Gasoline",
    color: "Summit White",
    dealer: DEALERS.marin,
    photos: BASE_PHOTOS,
    description:
      "Brand new Trax LS. Straight MSRP, no add-ons in fine print.",
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
    location: "Bay Area, CA",
    bodyStyle: "Sedan",
    drivetrain: "RWD",
    transmission: "Automatic",
    fuelType: "Gasoline",
    color: "White",
    dealer: DEALERS.bay,
    photos: BASE_PHOTOS,
    description:
      "Charger GT with Blacktop package. Dealer lists $699 protection package and $199 processing fee.",
  },
];

// ---- Fee extraction from dealer description ----

function extractFees(description = "") {
  const text = description.toLowerCase();
  const fees = [];

  const patterns = [
    { label: "Processing fee", regex: /(processing fee[^$]*\$?\s*([\d,]+))/i },
    { label: "Preparation fee", regex: /(prep(aration)? fee[^$]*\$?\s*([\d,]+))/i },
    { label: "Reconditioning fee", regex: /(reconditioning fee[^$]*\$?\s*([\d,]+))/i },
    { label: "Documentation fee", regex: /(doc(umentation)? fee[^$]*\$?\s*([\d,]+))/i },
    { label: "Protection package", regex: /(protection package[^$]*\$?\s*([\d,]+))/i },
    { label: "Appearance package", regex: /(appearance package[^$]*\$?\s*([\d,]+))/i },
  ];

  for (const { label, regex } of patterns) {
    const match = description.match(regex);
    if (!match) continue;
    const numRaw = match[2] || match[3] || "";
    const amount = Number(numRaw.replace(/,/g, ""));
    if (!Number.isNaN(amount) && amount > 0) {
      fees.push({ label, amount });
    }
  }

  return fees;
}

const VEHICLES = RAW_VEHICLES.map((v) => {
  const fees = extractFees(v.description || "");
  const feesTotal = fees.reduce((sum, f) => sum + f.amount, 0);
  return {
    ...v,
    fees,
    totalWithFees: v.price + feesTotal,
    title: `${v.year} ${v.make} ${v.model}${v.trim ? " " + v.trim : ""}`,
    keywords: `${v.make} ${v.model} ${v.trim} ${v.vin}`.toLowerCase(),
  };
});

// ---- Public API (frontend only) ----

export async function searchVehicles({
  q = "",
  page = 1,
  pagesize = 20,
} = {}) {
  const term = (q || "").toString().trim().toLowerCase();
  let filtered = VEHICLES;

  if (term) {
    filtered = VEHICLES.filter((v) => v.keywords.includes(term));
  }

  const start = (page - 1) * pagesize;
  const results = filtered.slice(start, start + pagesize);

  return {
    ok: true,
    query: { q: term, page, pagesize },
    results,
    count: results.length,
    total: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / pagesize)),
  };
}

export async function getVehicle(vin) {
  const found = VEHICLES.find(
    (v) => v.vin.toLowerCase() === String(vin).toLowerCase()
  );
  if (!found) throw new Error("Not found");
  return { ok: true, vehicle: found };
}

export function calculateShipping(distanceMiles) {
  const d = Number(distanceMiles || 0);
  if (!d || d <= 0) return 0;
  if (d <= 100) return 250;
  return 250 + (d - 100) * 2;
}
