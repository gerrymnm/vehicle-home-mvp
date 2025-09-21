import React from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { http } from "../lib/api.js";

const styles = {
  row: { padding: "10px 0", borderBottom: "1px solid #eee" },
  badge: { fontSize: 12, padding: "2px 6px", border: "1px solid #ccc", borderRadius: 4, marginLeft: 8 },
};

export default function Search() {
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const q = sp.get("q") || "";
  const page = Number(sp.get("page") || 1);
  const [state, setState] = React.useState({ items: [], total: 0, error: "" });
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let on = true;
    (async () => {
      try {
        setLoading(true);
        const data = await http.get("/api/search", { q, page, pageSize: 20 });
        if (!on) return;
        setState({ items: data.results || [], total: data.total || 0, error: "" });
      } catch (e) {
        if (!on) return;
        setState({ items: [], total: 0, error: String(e.message || e) });
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [q, page]);

  function onSubmit(e) {
    e.preventDefault();
    const input = new FormData(e.currentTarget).get("q") || "";
    setSp({ q: input, page: "1" });
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2>Find your next vehicle</h2>
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
        <input name="q" defaultValue={q} style={{ flex: 1 }} placeholder="Search by make, model, VIN…" />
        <button>Search</button>
      </form>

      {loading && <p>Loading…</p>}
      {state.error && <p style={{ color: "red" }}>Error: {state.error}</p>}
      {!loading && !state.error && state.items.length === 0 && <p>No results.</p>}

      <div>
        {state.items.map(v => (
          <div key={v.vin} style={styles.row}>
            <div>
              <Link to={`/vehicles/${encodeURIComponent(v.vin)}`}>{v.year} {v.make} {v.model} {v.trim || ""}</Link>
              {v.sold ? <span style={styles.badge}>Sold</span> : null}
            </div>
            <div style={{ fontSize: 13, color: "#666" }}>
              VIN: {v.vin} • {v.mileage?.toLocaleString?.() || v.mileage || "—"} miles • {v.location || "—"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
