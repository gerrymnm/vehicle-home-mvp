import { Router, Request, Response } from "express";
import { pool } from "./db";

const router = Router();

router.get("/search", async (req: Request, res: Response) => {
  try {
    const q = String(req.query.q ?? "").trim();
    const page = Math.max(parseInt(String(req.query.page ?? "1"), 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(String(req.query.pageSize ?? "20"), 10) || 20, 1), 50);
    const offset = (page - 1) * pageSize;

    if (!q) {
      return res.json({
        query: { q, dir: "asc", page, pageSize },
        count: 0,
        total: 0,
        totalPages: 0,
        results: [],
      });
    }

    const like = `%${q}%`;
    const where = `make ILIKE $1 OR model ILIKE $1 OR trim ILIKE $1 OR vin ILIKE $1`;
    const listSql = `SELECT vin, year, make, model, trim, mileage, price, location FROM vehicles WHERE ${where} ORDER BY year DESC OFFSET $3 LIMIT $2`;
    const countSql = `SELECT COUNT(*)::int AS c FROM vehicles WHERE ${where}`;

    const [list, count] = await Promise.all([
      pool.query(listSql, [like, pageSize, offset]),
      pool.query(countSql, [like]),
    ]);

    const total = count.rows[0]?.c ?? 0;
    const totalPages = Math.max(Math.ceil(total / pageSize), 0);

    res.json({
      query: { q, dir: "asc", page, pageSize },
      count: list.rowCount,
      total,
      totalPages,
      results: list.rows,
    });
  } catch (e) {
    res.status(500).json({ error: "search_failed" });
  }
});

export { router as searchRouter };
export default router;

