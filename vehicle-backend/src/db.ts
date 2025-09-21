import { Pool, QueryResult, QueryResultRow } from "pg";

const DATABASE_URL = process.env.DATABASE_URL || "";
if (!DATABASE_URL) {
  console.warn(
    "[db] Warning: DATABASE_URL is not set. The server will start but queries will fail."
  );
}

const ssl =
  process.env.PGSSL && process.env.PGSSL !== "0"
    ? { rejectUnauthorized: false }
    : undefined;

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl,
});

/** For legacy callers that import { getPool } from "../db" */
export function getPool(): Pool {
  return pool;
}

/** Thin convenience wrapper with correct pg typing */
export async function query<R extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<R>> {
  return pool.query<R>(text, params);
}

/** Some modules expect a 'db' with a .query method */
export const db = { query };

/** Create tables if they don't exist */
export async function initDB() {
  // Vehicles
  await query(`
    CREATE TABLE IF NOT EXISTS vehicles (
      vin TEXT PRIMARY KEY,
      year INT,
      make TEXT,
      model TEXT,
      trim TEXT,
      price NUMERIC,
      mileage INT,
      location TEXT,
      dealer_id INT,
      dealer_name TEXT,
      dealer_email TEXT,
      in_stock BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);

  // Events
  await query(`
    CREATE TABLE IF NOT EXISTS events (
      id BIGSERIAL PRIMARY KEY,
      vin TEXT NOT NULL,
      type TEXT NOT NULL,
      note TEXT,
      at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS events_vin_idx ON events (vin);`);

  // Leads
  await query(`
    CREATE TABLE IF NOT EXISTS leads (
      id BIGSERIAL PRIMARY KEY,
      vin TEXT NOT NULL,
      vehicle_title TEXT,
      dealer_id INT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      message TEXT,
      source TEXT,
      status TEXT DEFAULT 'new',
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS leads_dealer_idx ON leads (dealer_id, created_at DESC);`);
  await query(`CREATE INDEX IF NOT EXISTS leads_vin_idx ON leads (vin, created_at DESC);`);
}
