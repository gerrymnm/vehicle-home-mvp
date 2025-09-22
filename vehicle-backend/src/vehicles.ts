import { Router, Request, Response } from "express";
import { query } from "./db";

const router = Router();

async function ensure() {
  await query(`create table if not exists images(
    vin text not null,
    url text not null,
    created_at timestamptz default now()
  )`);
  await query(`create table if not exists events(
    vin text not null,
    type text not null,
    payload jsonb,
    created_at timestamptz default now()
  )`);
  await query(`create table if not exists liens(
    vin text primary key,
    lender text,
    title_with text,
    payoff_cents bigint,
    per_diem_cents bigint,
    payoff_10day_cents bigint,
    updated_at timestamptz default now()
  )`);
  await query(`create table if not exists inspections(
    vin text primary key,
    tires jsonb,
    brakes jsonb,
    notes text,
    inspector text,
    created_at timestamptz default now()
  )`);
}

router.get("/api/vehicles/:vin", async (req: Request, res: Response) => {
  await ensure();
  const vin = String(req.params.vin || "").trim();
  try {
    const vq = await query(
      `select vin, year, make, model, trim, mileage, price, location, status
       from leads where vin=$1 limit 1`,
      [vin]
    );
    const vehicle = vq.rows[0] || null;

    const images = (
      await query(`select url from images where vin=$1 order by created_at desc`, [vin])
    ).rows.map((r) => r.url);

    const history = (
      await query(
        `select type, payload, created_at from events where vin=$1 order by created_at desc`,
        [vin]
      )
    ).rows;

    let metrics = null as null | { avg_price: number | null; listings: number };
    if (vehicle) {
      const m = await query(
        `select avg(price)::numeric as avg_price, count(*)::int as listings
         from leads
         where make=$1 and model=$2 and year between $3-1 and $3+1 and price is not null`,
        [vehicle.make, vehicle.model, vehicle.year]
      );
      metrics = {
        avg_price: m.rows[0]?.avg_price ?? null,
        listings: m.rows[0]?.listings ?? 0,
      };
    }

    const lienq = await query(`select lender, title_with, payoff_cents, per_diem_cents, payoff_10day_cents, updated_at from liens where vin=$1`, [vin]);
    const lien = lienq.rows[0] || null;

    const inspq = await query(`select tires, brakes, notes, inspector, created_at from inspections where vin=$1`, [vin]);
    const inspection = inspq.rows[0] || null;

    res.json({ vehicle, images, history, metrics, lien, inspection, anchor: { status: "pending" } });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "failed" });
  }
});

router.post("/api/vehicles/:vin/images", async (req: Request, res: Response) => {
  await ensure();
  const vin = String(req.params.vin || "").trim();
  const { url } = req.body || {};
  if (!vin || !url) return res.status(400).json({ error: "vin and url required" });
  await query(`insert into images(vin,url) values($1,$2)`, [vin, url]);
  await query(`insert into events(vin,type,payload) values($1,$2,$3)`, [vin, "image_added", { url }]);
  res.json({ ok: true });
});

router.post("/api/vehicles/:vin/lien", async (req: Request, res: Response) => {
  await ensure();
  const vin = String(req.params.vin || "").trim();
  const { lender, title_with, payoff_cents, per_diem_cents, payoff_10day_cents } = req.body || {};
  if (!vin) return res.status(400).json({ error: "vin required" });
  await query(
    `insert into liens(vin,lender,title_with,payoff_cents,per_diem_cents,payoff_10day_cents,updated_at)
     values($1,$2,$3,$4,$5,$6,now())
     on conflict (vin) do update set lender=$2,title_with=$3,payoff_cents=$4,per_diem_cents=$5,payoff_10day_cents=$6,updated_at=now()`,
    [vin, lender ?? null, title_with ?? null, payoff_cents ?? null, per_diem_cents ?? null, payoff_10day_cents ?? null]
  );
  await query(`insert into events(vin,type,payload) values($1,$2,$3)`, [vin, "lien_updated", { lender, title_with }]);
  res.json({ ok: true });
});

router.post("/api/vehicles/:vin/inspection", async (req: Request, res: Response) => {
  await ensure();
  const vin = String(req.params.vin || "").trim();
  const { tires, brakes, notes, inspector } = req.body || {};
  if (!vin) return res.status(400).json({ error: "vin required" });
  await query(
    `insert into inspections(vin,tires,brakes,notes,inspector,created_at)
     values($1,$2,$3,$4,$5,now())
     on conflict (vin) do update set tires=$2,brakes=$3,notes=$4,inspector=$5,created_at=now()`,
    [vin, tires ?? null, brakes ?? null, notes ?? null, inspector ?? null]
  );
  await query(`insert into events(vin,type,payload) values($1,$2,$3)`, [vin, "inspection_updated", { tires, brakes }]);
  res.json({ ok: true });
});

export default router;
