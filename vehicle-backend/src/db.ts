// vehicle-backend/src/db.ts
import pg from "pg";

const { Pool } = pg;

function sslSetting() {
  if (process.env.PGSSL?.toLowerCase() === "true") {
    return { rejectUnauthorized: false } as any;
  }
  return undefined;
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting()
});

// Tiny tagged-template query helper → returns rows[]
export async function sql(strings: TemplateStringsArray, ...values: any[]) {
  const text = strings.reduce(
    (acc, s, i) => acc + s + (i < values.length ? `$${i + 1}` : ""),
    ""
  );
  const result = await pool.query(text, values);
  return result.rows as any[];
}

export default pool;
export function getPool() {
  return pool;
}
