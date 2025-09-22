import { Pool, PoolClient, QueryResult } from "pg";

/**
 * Connection pool. Expects DATABASE_URL to be set (Render/Neon friendly).
 * Set PGSSL=disable locally if you don't want SSL.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.PGSSL === "disable"
      ? false
      : { rejectUnauthorized: false },
});

/** Low-level pool (query API): db.query(text, params) */
export const db = pool;

/** Back-compat for files that do: import { getPool } from "./db" */
export function getPool(): Pool {
  return pool;
}

/**
 * Tagged template helper so you can write:
 *   const rows = await sql`SELECT * FROM vehicles WHERE vin = ${vin} LIMIT 1`;
 * It returns result.rows directly (array of objects).
 */
export async function sql(
  strings: TemplateStringsArray,
  ...values: any[]
): Promise<any[]> {
  // Build parameterized query text + params [$1, $2, ...]
  let text = "";
  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) text += `$${i + 1}`;
  }
  const result: QueryResult = await pool.query(text, values);
  return result.rows;
}

/** Optional helper for transactions or multi-step work with a client */
export async function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

export default pool;
