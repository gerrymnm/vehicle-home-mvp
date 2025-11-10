// vehicle-marketplace/src/pages/Search.jsx
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchVehicles } from "../lib/api.js";

const wrap = { maxWidth: 960, margin: "24px auto", padding: "0 16px" };
const h1 = { fontSize: "22px", fontWeight: 600, marginBottom: 12 };
const err = { color: "crimson", marginTop: 12 };

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const page = Number(params.get("page") || 1);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      const query = params.get("q") || "";
      if (!query.trim()) {
        setResults([]);
        setError("");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const data = await searchVehicles({
          q: query,
          page,
          pagesize: 50,
        });
        setResults(Array.isArray(data.results) ? data.results : []);
      } catch (e) {
        setError(`Search failed: ${e.message || e}`);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [params, page]);

  const onSubmit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (q.trim()) next.set("q", q.trim());
    else next.delete("q");
    next.set("page", "1");
    setParams(next);
  };

  return (
    <div style={wrap}>
      <h1 style={h1}>Find your next vehicle</h1>

      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by make, model, VIN…"
          style={{ flex: 1, padding: "8px 10px", borderRadius: 6, border: "1px solid #d1d5db" }}
        />
        <button type="submit" style={{ padding: "8px 14px", borderRadius: 6 }}>
          Search
        </button>
      </form>

      <p style={{ color: "#6b7280", fontSize: 12, marginTop: 8 }}>
        Try: <em>Mazda, Chevrolet, Subaru, Charger</em>
      </p>

      {loading && <p>Loading…</p>}
      {error && <p style={err}>Error: {error}</p>}

      {!loading && !error && params.get("q") && (
        <ul style={{ marginTop: 16, listStyle: "none", padding: 0 }}>
          {results.length === 0 && <p>No results.</p>}
          {results.map((r) => (
            <li key={r.vin} style={{ marginBottom: 14, paddingBottom: 10, borderBottom: "1px solid #f3f4f6" }}>
              <Link
                to={`/vehicles/${r.vin}`}
                style={{ fontWeight: 600, textDecoration: "none", color: "#111827" }}
              >
                {r.title}
              </Link>
              <div style={{ fontSize: 12, color: "#4b5563" }}>
                VIN {r.vin} • {r.mileage?.toLocaleString()} miles • {r.location} • $
                {r.price.toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
