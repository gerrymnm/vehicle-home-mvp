// vehicle-marketplace/src/pages/Search.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";

export default function Search() {
  const nav = useNavigate();
  const loc = useLocation();
  const qs = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
  const [q, setQ] = useState(qs.get("q") || "");
  const [page, setPage] = useState(Number(qs.get("page") || 1));
  const [state, setState] = useState({ results: [], total: 0, count: 0 });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    setErr("");
    const run = async () => {
      setLoading(true);
      try {
        const data = await api.search({ q: qs.get("q") || "", page: Number(qs.get("page") || 1) });
        // data comes back as: { ok: true, query: {...}, count, total, totalPages, results: [...] }
        setState({ results: data.results || [], total: data.total || 0, count: data.count || 0 });
      } catch (e) {
        setErr(e.message || String(e));
        setState({ results: [], total: 0, count: 0 });
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [qs]);

  const onSubmit = (e) => {
    e.preventDefault();
    nav(`/search?q=${encodeURIComponent(q)}&page=1`);
    setPage(1);
  };

  return (
    <div style={{ maxWidth: 920, margin: "32px auto" }}>
      <h2>Find your next vehicle</h2>
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8, margin: "12px 0 18px" }}>
        <input
          type="search"
          placeholder="Search by make, model, VIN..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ flex: 1, padding: "8px 10px" }}
        />
        <button type="submit">Search</button>
      </form>

      {loading && <p>Loading…</p>}
      {err && <p style={{ color: "crimson" }}>Error: {err}</p>}

      {!loading && !err && state.results.length === 0 && <p>No results.</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {state.results.map((r) => (
          <li key={r.vin} style={{ padding: "12px 0" }}>
            <a href={`/vehicles/${encodeURIComponent(r.vin)}`} style={{ fontWeight: 600 }}>
              {r.title || `${r.year} ${r.make} ${r.model} ${r.trim ?? ""}`.trim()}
            </a>
            <div style={{ color: "#555", fontSize: 14, marginTop: 4 }}>
              VIN: {r.vin}
              {typeof r.mileage === "number" ? ` • ${r.mileage.toLocaleString()} miles` : ""}
              {r.location ? ` • ${r.location}` : ""}
            </div>
            {typeof r.price === "number" && (
              <div style={{ marginTop: 4 }}>${r.price.toLocaleString()}</div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
