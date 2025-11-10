// src/pages/Search.jsx
import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchVehicles, analyzeFees, computeTotalWithFees } from "../lib/api.js";

const wrap = { maxWidth: 960, margin: "24px auto", padding: "0 16px" };
const h1 = { fontSize: 22, fontWeight: 600, marginBottom: 16 };
const err = { color: "crimson", marginTop: 12 };
const list = { marginTop: 16, display: "flex", flexDirection: "column", gap: 12 };
const card = {
  display: "flex",
  gap: 16,
  padding: 12,
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  alignItems: "center",
};

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const page = Number(params.get("page") || 1);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const run = async () => {
      if (!params.get("q")) {
        setResults([]);
        setError("");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await searchVehicles({
          q: params.get("q") || "",
          page,
          pagesize: 20,
        });
        setResults(res.results || []);
      } catch (e) {
        setError(e.message || String(e));
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
          style={{
            flex: 1,
            padding: "9px 10px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "9px 16px",
            borderRadius: 6,
            border: "none",
            background: "#111827",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </form>

      <p style={{ color: "#6b7280", fontSize: 12, marginTop: 8 }}>
        Try: <em>Mazda, CX-5, e-Golf…</em>
      </p>

      {loading && <p>Loading…</p>}
      {error && <p style={err}>Error: {error}</p>}

      {!loading && !error && (
        <div style={list}>
          {results.length === 0 && params.get("q") && <p>No results.</p>}
          {results.map((v) => {
            const fees = analyzeFees(v.description);
            const total = computeTotalWithFees(v.price, fees) || v.price;
            return (
              <Link
                key={v.vin}
                to={`/vehicles/${v.vin}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div style={card}>
                  <div
                    style={{
                      width: 140,
                      height: 90,
                      backgroundColor: "#f3f4f6",
                      borderRadius: 6,
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                  >
                    {v.images?.[0] && (
                      <img
                        src={v.images[0]}
                        alt={v.title || `${v.year} ${v.make} ${v.model}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>
                      {v.year} {v.make} {v.model}
                      {v.trim ? ` ${v.trim}` : ""}
                    </div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      VIN: {v.vin} •{" "}
                      {v.mileage != null
                        ? `${Number(v.mileage).toLocaleString()} mi`
                        : "Mileage N/A"}{" "}
                      • {v.location}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 13,
                        color: "#4b5563",
                      }}
                    >
                      {v.dealer?.name}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 18,
                        color: "#111827",
                      }}
                    >
                      ${Number(total).toLocaleString()}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#9ca3af",
                        marginTop: 2,
                      }}
                    >
                      Est. with dealer add-ons
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
