// vehicle-backend/src/db.ts
import { Pool, QueryResult } from "pg";

/**
 * PG connection pool. Expects process.env.DATABASE_URL to be set.
 * Works on Render/Neon. SSL is enabled by default (safe for most hosted PG).
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.PGSSL === "disable"
      ? false
      : { rejectUnauthorized: false }, // Render/Neon friendly
});

/** Low-level pool (query API): db.query(text, params) */
export const db = pool;

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

export default pool;
