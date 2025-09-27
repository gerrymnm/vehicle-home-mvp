// vehicle-marketplace/src/pages/Search.jsx
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../lib/api.js";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const page = parseInt(params.get("page") || "1", 10);

  const [state, setState] = useState({
    results: [],
    count: 0,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const run = async () => {
      if (!q) {
        setState({ results: [], count: 0, total: 0, totalPages: 0 });
        return;
      }
      setLoading(true);
      setErr("");
      try {
        const data = await api.search({ q, page });
        // backend returns { ok, results, count, total, totalPages, ... }
        const results = data?.results || [];
        setState({
          results,
          count: data?.count ?? results.length,
          total: data?.total ?? results.length,
          totalPages: data?.totalPages ?? 1,
        });
      } catch (e) {
        setErr(e.message || String(e));
        setState({ results: [], count: 0, total: 0, totalPages: 0 });
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [q, page]);

  const onSubmit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (q) next.set("q", q);
    else next.delete("q");
    next.set("page", "1");
    setParams(next);
  };

  return (
    <div style={{ maxWidth: 760, margin: "2rem auto" }}>
      <h2>Find your next vehicle</h2>

      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search make, model, trim…"
          style={{ flex: 1 }}
        />
        <button type="submit">Search</button>
      </form>

      <p style={{ color: "#666", fontSize: 12 }}>
        Try: Mazda, Accord, Grand Cherokee
      </p>

      {err && <p style={{ color: "red" }}>Error: {err}</p>}
      {loading && <p>Loading…</p>}

      {!loading && !err && (
        state.results.length ? (
          <ul style={{ padding: 0, listStyle: "none" }}>
            {state.results.map((v) => (
              <li
                key={v.vin}
                style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}
              >
                <Link to={`/vehicles/${encodeURIComponent(v.vin)}`}>
                  {v.title || `${v.year} ${v.make} ${v.model} ${v.trim || ""}`}
                </Link>
                <div style={{ fontSize: 12, color: "#444" }}>
                  VIN: {v.vin} • {v.mileage?.toLocaleString?.() || v.mileage}{" "}
                  miles • {v.location}
                </div>
                <div style={{ fontSize: 12 }}>
                  ${v.price?.toLocaleString?.()}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No results.</p>
        )
      )}
    </div>
  );
}
