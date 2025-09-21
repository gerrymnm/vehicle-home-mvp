import React from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { http } from "../lib/api.js";

const styles = {
  layout: { maxWidth: 1100, margin: "24px auto" },
  row: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" },
  input: { padding: 6, minWidth: 260 },
  select: { padding: 6 },
  table: { width: "100%", borderCollapse: "collapse", marginTop: 12 },
  th: { textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px 6px" },
  td: { borderBottom: "1px solid #eee", padding: "8px 6px" },
  badgeIn: { display: "inline-block", background: "#e8f6ee", color: "#0a6c3e", padding: "2px 8px", borderRadius: 12, fontSize: 12 },
  badgeOut: { display: "inline-block", background: "#f9eaea", color: "#9a1f1f", padding: "2px 8px", borderRadius: 12, fontSize: 12 },
  pager: { display: "flex", gap: 6, alignItems: "center", justifyContent: "flex-end", marginTop: 12 }
};

function Money({ v }) {
  return <span>{typeof v === "number" ? `$${v.toLocaleString()}` : "—"}</span>;
}

export default function Search() {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const qInit = sp.get("q") || "";
  const pageInit = Number(sp.get("page") || 1);
  const pageSizeInit = Number(sp.get("pageSize") || 20);
  const sortInit = sp.get("sort") || "relevance";
  const inStockOnlyInit = sp.get("inStockOnly") === "1";

  const [q, setQ] = React.useState(qInit);
  const [results, setResults] = React.useState([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(pageInit);
  const [pageSize, setPageSize] = React.useState(pageSizeInit);
  const [sort, setSort] = React.useState(sortInit);
  const [inStockOnly, setInStockOnly] = React.useState(inStockOnlyInit);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");

  function syncUrl(next = {}) {
    const params = new URLSearchParams({
      q,
      page: String(next.page ?? page),
      pageSize: String(next.pageSize ?? pageSize),
      sort: next.sort ?? sort,
      inStockOnly: (next.inStockOnly ?? inStockOnly) ? "1" : "0"
    });
    setSp(params, { replace: false });
  }

  async function runSearch(nextPage = 1, keepPage = false) {
    setLoading(true);
    setErr("");
    try {
      const url = `/api/search?q=${encodeURIComponent(q)}&page=${keepPage ? page : nextPage}&pageSize=${pageSize}&sort=${encodeURIComponent(sort)}&inStockOnly=${inStockOnly ? "1" : "0"}`;
      const data = await http.get(url);

      // Backend may return {results,total,page,pageSize}; if not, fallback.
      const arr = Array.isArray(data) ? data : (data.results || []);
      const tot = typeof data.total === "number" ? data.total : arr.length;

      // Fallback filters/sort if server ignores them:
      let list = arr.slice();
      if (inStockOnly) list = list.filter(v => v.inStock !== false);

      switch (sort) {
        case "priceAsc": list.sort((a,b)=>(a.price??1e15)-(b.price??1e15)); break;
        case "priceDesc": list.sort((a,b)=>(b.price??-1)-(a.price??-1)); break;
        case "yearDesc": list.sort((a,b)=>(b.year??0)-(a.year??0)); break;
        case "mileageAsc": list.sort((a,b)=>(a.mileage??1e15)-(b.mileage??1e15)); break;
        default: break; // relevance (server-side)
      }

      // If server didn’t paginate, do it client-side:
      let pg = typeof data.page === "number" ? data.page : (keepPage ? page : nextPage);
      let pz = typeof data.pageSize === "number" ? data.pageSize : pageSize;
      if (typeof data.page !== "number") {
        const start = (pg - 1) * pz;
        list = list.slice(start, start + pz);
      }

      setResults(list);
      setTotal(tot);
      setPage(pg);
      setPageSize(pz);
      syncUrl({ page: pg });
    } catch (e) {
      console.error(e);
      setErr("Search failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function submit(e) {
    e.preventDefault();
    runSearch(1);
  }

  React.useEffect(() => {
    // Run when arriving via URL
    if (qInit || sp.has("q")) runSearch(pageInit, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section style={styles.layout}>
      <h2>Search</h2>

      <form onSubmit={submit} style={{ ...styles.row, marginTop: 8 }}>
        <input
          style={styles.input}
          placeholder="Search by make, model, VIN…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select style={styles.select} value={sort} onChange={e => { setSort(e.target.value); runSearch(1); }}>
          <option value="relevance">Sort: Relevance</option>
          <option value="priceAsc">Sort: Price ↑</option>
          <option value="priceDesc">Sort: Price ↓</option>
          <option value="yearDesc">Sort: Year ↓</option>
          <option value="mileageAsc">Sort: Mileage ↑</option>
        </select>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={inStockOnly} onChange={e => { setInStockOnly(e.target.checked); runSearch(1); }} />
          In stock only
        </label>
        <button>Search</button>
      </form>

      {err && <div style={{ color: "#a00", marginTop: 8 }}>{err}</div>}
      {loading && <div style={{ marginTop: 12 }}>Searching…</div>}

      {!loading && results.length === 0 && (
        <div style={{ marginTop: 16, opacity: .8 }}>No results.</div>
      )}

      {results.length > 0 && (
        <>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Vehicle</th>
                <th style={styles.th}>VIN</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Price</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Mileage</th>
                <th style={styles.th}>Location</th>
                <th style={{ ...styles.th, textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((v) => (
                <tr key={v.vin}>
                  <td style={styles.td}>
                    <Link to={`/v/${encodeURIComponent(v.vin)}`}>
                      {v.year} {v.make} {v.model} {v.trim || ""}
                    </Link>
                  </td>
                  <td style={styles.td}>{v.vin}</td>
                  <td style={{ ...styles.td, textAlign: "right" }}><Money v={v.price} /></td>
                  <td style={{ ...styles.td, textAlign: "right" }}>{v.mileage?.toLocaleString() ?? "—"}</td>
                  <td style={styles.td}>{v.location || "—"}</td>
                  <td style={{ ...styles.td, textAlign: "center" }}>
                    {v.inStock !== false
                      ? <span style={styles.badgeIn}>In stock</span>
                      : <span style={styles.badgeOut}>Sold</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={styles.pager}>
            <span style={{ opacity: .7 }}>Page {page} of {pages}</span>
            <button disabled={page <= 1} onClick={() => { setPage(page - 1); runSearch(page - 1); }}>Prev</button>
            <button disabled={page >= pages} onClick={() => { setPage(page + 1); runSearch(page + 1); }}>Next</button>
          </div>
        </>
      )}
    </section>
  );
}
