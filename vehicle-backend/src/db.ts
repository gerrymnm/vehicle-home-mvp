import { Pool } from "pg";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (pool) return pool;

  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    "postgres://postgres:postgres@localhost:5432/vehicle_home";

  // Set PGSSL=1 in .env if using Neon/Supabase/etc.
  const useSSL = process.env.PGSSL === "1" || process.env.PGSSLMODE === "require";
  pool = new Pool({
    connectionString,
    ssl: useSSL ? { rejectUnauthorized: false } : undefined,
  });
  return pool;
}

export async function initDb(): Promise<void> {
  const db = getPool();

  // Core tables
  await db.query(`
    CREATE TABLE IF NOT EXISTS dealers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin','dealer','consumer')),
      dealer_id INTEGER REFERENCES dealers(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS vehicles (
      vin TEXT PRIMARY KEY,
      year INTEGER NOT NULL,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      trim TEXT,
      mileage INTEGER,
      price INTEGER,
      location TEXT,
      in_stock BOOLEAN NOT NULL DEFAULT TRUE,
      dealer_id INTEGER REFERENCES dealers(id) ON DELETE SET NULL,
      owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      vin TEXT NOT NULL REFERENCES vehicles(vin) ON DELETE CASCADE,
      type TEXT NOT NULL,
      timestamp TIMESTAMPTZ NOT NULL,
      note TEXT,
      payload JSONB
    );
    CREATE INDEX IF NOT EXISTS idx_events_vin_ts ON events(vin, timestamp DESC);
  `);

  // Seed a few vehicles if empty
  const { rows } = await db.query<{ c: number }>(`SELECT COUNT(*)::int AS c FROM vehicles;`);
  if (rows[0].c === 0) {
    await db.query(
      `
      INSERT INTO vehicles (vin, year, make, model, trim, mileage, price, location, in_stock)
      VALUES
      ('JM1BPBLL9M1300001', 2021, 'Mazda', 'Mazda3', 'Preferred', 24500, 20995, 'Marin County, CA', TRUE),
      ('5J6TF3H33CL003984', 2012, 'Honda', 'Accord',  'EX',       98650,  9995, 'South San Francisco, CA', TRUE),
      ('3MZBPACL4PM300002', 2023, 'Mazda', 'Mazda3', 'Select',     5800,  23950, 'Bay Area, CA', TRUE)
      ON CONFLICT (vin) DO NOTHING;
    `
    );
  }
}
