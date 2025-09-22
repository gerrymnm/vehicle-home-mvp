import { Router } from "express";
const router = Router();

router.get("/", (req, res) => {
  const q = String(req.query.q || "").toLowerCase();
  const page = Math.max(parseInt(String(req.query.page || "1"), 10) || 1, 1);
  const pageSize = Math.max(parseInt(String(req.query.pageSize || "20"), 10) || 20, 1);

  const all = [
    {
      vin: "3MZBPACL4PM300002",
      year: 2023,
      make: "Mazda",
      model: "Mazda3",
      trim: "Select",
      mileage: 5800,
      price: 23950,
      location: "Bay Area, CA",
      title: "2023 Mazda Mazda3 Select",
    },
    {
      vin: "JM1BPBLL9M1300001",
      year: 2021,
      make: "Mazda",
      model: "Mazda3",
      trim: "Preferred",
      mileage: 24500,
      price: 20995,
      location: "Marin County, CA",
      title: "2021 Mazda Mazda3 Preferred",
    },
  ];

  const filtered = q
    ? all.filter((x) =>
        [x.make, x.model, x.trim, x.title].join(" ").toLowerCase().includes(q)
      )
    : all;

  const start = (page - 1) * pageSize;
  const results = filtered.slice(start, start + pageSize);

  res.json({
    query: { q, page, pageSize, dir: "asc" },
    count: results.length,
    total: filtered.length,
    totalPages: Math.max(1, Math.ceil(filtered.length / pageSize)),
    results,
  });
});

export default router;
