// Full file: vehicle-marketplace/src/pages/Search.jsx
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../lib/api.js";

const container = {
  maxWidth: "900px",
  margin: "0 auto",
  padding: "24px 16px",
};

export default function Search() {
  const [sp] = useSearchParams();
  const [query, setQuery] = useState(sp.get("q") || "");
  const [page, setPage] = useState(Number(sp.get("page") || 1));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  async function run() {
    setLoading(true);
    setError("");
    setData(null);
    try {
      const res = await api.searchVehicles(query, page, 20);
      // Backend returns: { ok, count, total, totalPages, results }
      if (res?.ok === false) {
        throw new Error(res?.error || "Search failed");
      }
      setData(res);
    } catch (e) {
      console.error("Search error:", e);
      setError(e?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // re-run whenever the URL changes (?q= & page=)
    const p = Number(sp.get("page") || 1);
    setPage(p);
    setQuery(sp.get("q") || "");
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp.toString()]);

  return (
    <div style={container}>
      <h2 style={{ fontSize: 22, margin: "6px 0 12px", fontWeight: 700 }}>
        Find your next vehicle
      </h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const params = new URLSearchParams(sp);
          params.set("q", (query || "").trim());
          params.set("page", "1");
          window.location.search = params.toString();
        }}
        style={{ display: "flex", gap: 8, marginBottom: 12 }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by make, model, VIN…"
          style={{ flex: 1, padding: "8px 10px" }}
        />
        <button type="submit" style={{ padding: "8px 12px" }}>
          Search
        </button>
      </form>

      <p style={{ color: "#666", fontSize: 12, margin: "6px 0 14px" }}>
        Try: <em>Mazda, Accord, Grand Cherokee</em>
      </p>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}

      {!loading && !error && data?.results?.length > 0 && (
        <ul style={{ paddingLeft: 18, lineHeight: 1.6 }}>
          {data.results.map((r, i) => {
            const title =
              r.title ||
              `${r.year ?? ""} ${r.make ?? ""} ${r.model ?? ""}${
                r.trim ? " " + r.trim : ""
              }`.trim();
            const subtitle = [
              r.vin ? `VIN: ${r.vin}` : null,
              r.mileage ? `${Number(r.mileage).toLocaleString()} miles` : null,
              r.location || null,
              r.price ? `$${Number(r.price).toLocaleString()}` : null,
            ]
              .filter(Boolean)
              .join(" • ");
            return (
              <li key={r.vin || i}>
                <Link to={`/vehicles/${encodeURIComponent(r.vin)}`}>{title}</Link>
                <div style={{ fontSize: 12, color: "#444" }}>{subtitle}</div>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && !error && (!data || data?.results?.length === 0) && (
        <p>No results.</p>
      )}
    </div>
  );
}
