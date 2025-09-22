import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";

export default function Search() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [q, setQ] = useState(params.get("q") || "");
  const page = Number(params.get("page") || 1);

  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    // Whenever URL params change, refetch
    const qParam = params.get("q") || "";
    if (!qParam) {
      setState(null);
      setErr("");
      return;
    }
    run(qParam, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  async function run(qValue, pageValue) {
    setErr("");
    setLoading(true);
    try {
      const data = await api.search({ q: qValue, page: pageValue });
      setState(data);
    } catch (e) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(q)}&page=1`);
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px" }}>
      <h2>Find your next vehicle</h2>

      <form onSubmit={onSubmit} role="search" aria-label="Vehicle Search" style={{ display: "flex", gap: 8 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by make, model, VIN..."
          style={{ flex: 1, padding: "8px" }}
          name="q"
          aria-label="Search query"
        />
        <button type="submit" style={{ padding: "8px 12px" }}>Search</button>
      </form>

      <p style={{ color: "#666", marginTop: 6, fontSize: 13 }}>
        Try: <em>Mazda, Accord, Grand Cherokee</em>
      </p>

      {loading && <p>Loading…</p>}
      {err && <p style={{ color: "crimson" }}>Error: {err}</p>}

      {state && (state.results?.length ? (
        <ul style={{ listStyle: "none", padding: 0, marginTop: 18 }}>
          {state.results.map((v) => {
            const title = [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ");
            return (
              <li key={v.vin} style={{ padding: "10px 0", borderBottom: "1px solid #eee" }}>
                <div style={{ fontWeight: 600 }}>
                  <Link to={`/vehicles/${v.vin}`}>{title}</Link>
                </div>
                <div style={{ color: "#333", fontSize: 14 }}>
                  VIN: {v.vin}
                  {v.mileage != null && <> • {v.mileage?.toLocaleString?.()} miles</>}
                  {v.location && <> • {v.location}</>}
                </div>
                {v.price != null && (
                  <div style={{ color: "#333", fontSize: 14 }}>
                    ${Number(v.price).toLocaleString()}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p>No results.</p>
      ))}
    </main>
  );
}
