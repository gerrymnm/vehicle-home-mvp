import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchVehicles, fetchMetrics } from "../api";

export default function SearchResults() {
  const loc = useLocation();
  const nav = useNavigate();
  const params = React.useMemo(() => new URLSearchParams(loc.search), [loc.search]);

  const q = params.get("q") || "";
  const make = params.get("make") || "";
  const model = params.get("model") || "";
  const trim = params.get("trim") || "";
  const page = Number(params.get("page") || 1);

  const [data, setData] = React.useState(null);
  const [metrics, setMetrics] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancel = false;
    setLoading(true);
    (async () => {
      try {
        const [vehicles, metric] = await Promise.all([
          fetchVehicles({ q, make, model, trim, sort: "price", dir: "asc", page, pageSize: 20 }),
          fetchMetrics({ make: make || undefined, model: model || undefined, trim: trim || undefined }),
        ]);
        if (!cancel) {
          setData(vehicles);
          setMetrics(metric);
        }
      } catch (e) {
        console.error(e);
        if (!cancel) {
          setData({ results: [], total: 0, totalPages: 1 });
          setMetrics(null);
        }
      } finally {
        !cancel && setLoading(false);
      }
    })();
    return () => (cancel = true);
  }, [q, make, model, trim, page]);

  function updateParam(key, value) {
    const p = new URLSearchParams(loc.search);
    if (value) p.set(key, value);
    else p.delete(key);
    // Reset page when changing filters
    if (["q", "make", "model", "trim"].includes(key)) p.delete("page");
    nav(`/search?${p.toString()}`);
  }

  function goPage(p) {
    const s = new URLSearchParams(loc.search);
    s.set("page", String(p));
    nav(`/search?${s.toString()}`);
  }

  return (
    <div>
      {/* Filters */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 8,
        marginBottom: 12
      }}>
        <input placeholder="Make" value={make} onChange={(e) => updateParam("make", e.target.value)} style={input} />
        <input placeholder="Model" value={model} onChange={(e) => updateParam("model", e.target.value)} style={input} />
        <input placeholder="Trim" value={trim} onChange={(e) => updateParam("trim", e.target.value)} style={input} />
        <button onClick={() => { updateParam("make", ""); updateParam("model", ""); updateParam("trim", ""); }}
          style={buttonSecondary}>Clear</button>
      </div>

      {/* Metrics */}
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <MetricCard label="Available" value={metrics?.count ?? "—"} />
        <MetricCard label="Avg Price" value={n(metrics?.avgPrice)} />
        <MetricCard label="Min / Max" value={
          metrics?.minPrice != null || metrics?.maxPrice != null
            ? `${n(metrics?.minPrice)} / ${n(metrics?.maxPrice)}`
            : "—"
        } />
        <MetricCard label="Price Trend" value={trend(metrics?.trend)} />
      </div>

      {/* Results */}
      <div>
        {loading ? (
          <div style={{ padding: 24 }}>Loading…</div>
        ) : (data?.results?.length ? (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {data.results.map((v) => (
              <li key={v.vin} style={card} onClick={() => nav(`/v/${v.vin}`)}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  {v.year} {v.make} {v.model} {v.trim ? `· ${v.trim}` : ""}
                </div>
                <div style={{ marginBottom: 4 }}>{v.vin}</div>
                <div style={{ marginBottom: 4 }}>{v.location || "—"}</div>
                <div style={{ fontWeight: 700 }}>{n(v.price)}</div>
                <div
                  style={{
                    marginTop: 6,
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: 12,
                    background: v.inStock === false ? "#ffe8e8" : "#e8fff0",
                    border: "1px solid #ddd"
                  }}
                >
                  {v.inStock === false ? "Owned (individual)" : "For sale (dealer)"}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ padding: 24 }}>No results.</div>
        ))}
      </div>

      {/* Pagination */}
      {!!data?.totalPages && data.totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button disabled={page <= 1} onClick={() => goPage(page - 1)} style={buttonSecondary}>Prev</button>
          <div style={{ padding: "8px 12px", border: "1px solid #eee", borderRadius: 10 }}>
            Page {page} / {data.totalPages}
          </div>
          <button disabled={page >= data.totalPages} onClick={() => goPage(page + 1)} style={buttonSecondary}>Next</button>
        </div>
      )}
    </div>
  );
}

const input = { padding: "10px 12px", border: "1px solid #ddd", borderRadius: 10 };
const buttonSecondary = { padding: "10px 12px", border: "1px solid #ddd", background: "#fff", borderRadius: 10, cursor: "pointer" };
const card = { cursor: "pointer", border: "1px solid #eee", borderRadius: 16, padding: 12, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" };

function MetricCard({ label, value }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 16, padding: 12, minWidth: 160 }}>
      <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 700, fontSize: 18 }}>{value}</div>
    </div>
  );
}

function n(x) {
  return typeof x === "number" ? x.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "—";
}
function trend(t) {
  if (!t) return "—";
  if (t === "up") return "↑ Up";
  if (t === "down") return "↓ Down";
  return "→ Flat";
}
