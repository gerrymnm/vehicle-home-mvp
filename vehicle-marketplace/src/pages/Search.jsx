import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchVehicles } from "../lib/api.js";

const h1 = { fontSize: "22px", fontWeight: 600, margin: "24px 0 12px" };
const err = { color: "crimson", marginTop: 12 };

export default function Search() {
  const [params, setParams] = useSearchParams();

  // Derive the actual primitive values we care about from params
  const qParam = params.get("q") || "";
  const pageParam = Number(params.get("page") || 1);

  const [q, setQ] = useState(qParam);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      // if there is no ?q= in the URL, show an empty state
      if (!qParam) {
        setResults([]);
        setError("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const data = await searchVehicles({
          q: qParam,
          page: pageParam,
          pagesize: 20,
          dir: "asc",
          signal: controller.signal,
        });
        setResults(Array.isArray(data.results) ? data.results : []);
      } catch (e) {
        if (e.name === "AbortError") return; // ignore aborted request
        setError(`Search failed: ${e.message || e}`);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    run();
    return () => controller.abort();
  }, [qParam, pageParam]); // <- depend on primitive values, not the params object

  const onSubmit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (q) next.set("q", q);
    else next.delete("q");
    next.set("page", "1");
    setParams(next);
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
        <Link to="/">Vehicle Marketplace</Link>
        <Link to="/search">Search</Link>
        <Link to="/login">Dealer/Login</Link>
      </div>

      <h1 style={h1}>Find your next vehicle</h1>

      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by make, model, VIN…"
          style={{ flex: 1, padding: "8px 10px" }}
        />
        <button type="submit" style={{ padding: "8px 12px" }}>Search</button>
      </form>

      <p style={{ color: "#777", fontSize: 12, marginTop: 8 }}>
        Try: <em>Mazda, Accord, Grand Cherokee</em>
      </p>

      {loading && <p>Loading…</p>}
      {error && <p style={err}>Error: {error}</p>}

      {!loading && !error && (
        <ul style={{ marginTop: 12 }}>
          {results.length === 0 ? (
            <p>No results.</p>
          ) : (
            results.map((r) => (
              <li key={r.vin} style={{ marginBottom: 10 }}>
                <Link to={`/vehicles/${r.vin}`}>
                  {r.title || `${r.year} ${r.make} ${r.model}${r.trim ? " " + r.trim : ""}`}
                </Link>
                <div style={{ fontSize: 12, color: "#555" }}>
                  VIN: {r.vin}
                  {r.mileage != null ? <> • {Number(r.mileage).toLocaleString()} miles</> : null}
                  {r.location ? <> • {r.location}</> : null}
                  {r.price != null ? <> • ${r.price}</> : null}
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
