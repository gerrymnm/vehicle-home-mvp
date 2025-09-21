import { Pool, PoolConfig, QueryResult, QueryResultRow } from "pg";

/**
 * Pool configuration from env
 */
const { DATABASE_URL, PGSSL } = process.env;

if (!DATABASE_URL) {
  console.warn(
    "[db] WARNING: DATABASE_URL is not set. The server can start, but DB queries will fail."
  );
}

const cfg: PoolConfig = { connectionString: DATABASE_URL };

// Neon requires TLS; support PGSSL=1 or sslmode=require in URL
if (PGSSL === "1" || /sslmode=require/i.test(DATABASE_URL ?? "")) {
  cfg.ssl = { rejectUnauthorized: false };
}

export const pool = new Pool(cfg);

/**
 * Back-compat shim (some modules still import getPool)
 */
export function getPool(): Pool {
  return pool;
}

/**
 * Typed query helper
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: any[] = []
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

/**
 * Create tables / indexes if they don't exist
 */
export async function initDB(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id          BIGSERIAL PRIMARY KEY,
      vin         TEXT,
      name        TEXT NOT NULL,
      email       TEXT,
      phone       TEXT,
      message     TEXT,
      source      TEXT,
      status      TEXT DEFAULT 'new',
      created_at  TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS leads_vin_idx         ON leads (vin);
    CREATE INDEX IF NOT EXISTS leads_created_at_idx  ON leads (created_at DESC);
  `);

  console.log("[db] init complete (tables OK)");
}
