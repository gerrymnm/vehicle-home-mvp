// Full file: vehicle-marketplace/src/pages/Search.jsx
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../lib/api.js";

const wrap = {
  maxWidth: 900,
  margin: "24px auto",
  padding: "0 16px",
};

const h1 = { fontSize: "24px", fontWeight: 700, margin: "8px 0 16px" };
const input = { width: "100%", maxWidth: 560, padding: "8px" };
const btn = { padding: "8px 12px", marginLeft: 8, cursor: "pointer" };
const hint = { fontSize: 12, color: "#666", margin: "8px 0 16px" };
const errorStyle = { color: "#b00020", marginTop: 12 };

export default function Search() {
  const [params, setParams] = useSearchParams();
  const initialQ = params.get("q") || "";
  const initialPage = Number(params.get("page") || 1);

  const [q, setQ] = useState(initialQ);
  const [page, setPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [rows, setRows] = useState([]);

  async function runSearch(nextQ, nextPage = 1) {
    setLoading(true);
    setErr("");
    try {
      const resp = await api.searchVehicles(nextQ, nextPage);
      // Expect shape: { ok: true, results: [...] }
      if (!resp || resp.ok === false) {
        // backend error path (shape may include .error)
        throw new Error(resp?.error || "Search failed");
      }
      const results = Array.isArray(resp.results) ? resp.results : [];
      setRows(results);
    } catch (e) {
      setRows([]);
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    const nextQ = q.trim();
    const nextPage = 1;
    setParams({ q: nextQ, page: String(nextPage) });
    setPage(nextPage);
    runSearch(nextQ, nextPage);
  }

  useEffect(() => {
    if (!initialQ) return;
    runSearch(initialQ, initialPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount

  return (
    <div style={wrap}>
      <h1 style={h1}>Find your next vehicle</h1>

      <form onSubmit={onSubmit} style={{ display: "flex", alignItems: "center" }}>
        <input
          style={input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by make, model, VIN…"
          aria-label="Search vehicles"
        />
        <button style={btn} type="submit">Search</button>
      </form>

      <div style={hint}>Try: Mazda, Accord, Grand Cherokee</div>

      {loading && <div>Loading…</div>}
      {!loading && err && <div style={errorStyle}>Error: {err}</div>}

      {!loading && !err && rows.length === 0 && <div>No results.</div>}

      {!loading && !err && rows.length > 0 && (
        <ul>
          {rows.map((r) => (
            <li key={r.vin}>
              <Link to={`/vehicles/${encodeURIComponent(r.vin)}`}>
                {r.title || `${r.year} ${r.make} ${r.model}${r.trim ? ` ${r.trim}` : ""}`}
              </Link>
              <div style={{ fontSize: 12, color: "#555" }}>
                VIN: {r.vin} • {r.mileage?.toLocaleString?.() ?? r.mileage ?? "—"} miles • {r.location ?? "—"} • {r.price ? `$${Number(r.price).toLocaleString()}` : "—"}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
