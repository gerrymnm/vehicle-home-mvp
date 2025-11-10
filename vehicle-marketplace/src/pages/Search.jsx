// vehicle-marketplace/src/pages/Search.jsx

import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  searchVehicles,
  analyzeFees,
  computeTotalWithFees,
} from "../lib/api.js";

const wrap = { maxWidth: 1080, margin: "24px auto", padding: "0 16px" };
const h1 = { fontSize: "22px", fontWeight: 600, margin: "0 0 16px" };
const err = { color: "crimson", marginTop: 12 };
const hint = { color: "#777", fontSize: 12, margin: "4px 0 16px" };

function formatMoney(v) {
  if (v == null || Number.isNaN(Number(v))) return "--";
  return Number(v).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function calcDefaultDown(total) {
  if (!total || total <= 0) return 0;
  let down = Math.ceil((total * 0.1) / 1000) * 1000;
  if (total - down < 5000) {
    down = Math.max(0, total - 5000);
  }
  return down;
}

function calcMonthly(total, down, termMonths, apr = 0.075) {
  if (!total || termMonths <= 0) return null;

  const loan = Math.max(total - (down || 0), 0);
  if (loan <= 0) return 0;

  const monthlyRate = apr / 12;
  if (!monthlyRate) return loan / termMonths;

  const pow = Math.pow(1 + monthlyRate, termMonths);
  const payment = (loan * monthlyRate * pow) / (pow - 1);
  return payment;
}

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
      if (!query) {
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
          pagesize: 20,
          dir: "asc",
        });

        const list = Array.isArray(data.results) ? data.results : [];

        const enriched = list.map((v) => {
          const basePrice = Number(v.price) || 0;
          const desc =
            v.description ||
            v.comments ||
            (Array.isArray(v.highlights)
              ? v.highlights.join(" ")
              : v.highlights) ||
            "";

          const feeAnalysis = analyzeFees(desc);
          const totals = computeTotalWithFees(basePrice, feeAnalysis);
          const total = totals.total || basePrice;

          const term = 72;
          const down = calcDefaultDown(total);
          const monthly = calcMonthly(total, down, term);

          return {
            ...v,
            _vh: {
              total,
              down,
              term,
              monthly,
            },
          };
        });

        setResults(enriched);
      } catch (e) {
        console.error(e);
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
    if (q) next.set("q", q);
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
            padding: "9px 11px",
            borderRadius: 4,
            border: "1px solid #ccc",
            fontSize: 14,
          }}
        />
        <button
          type="submit"
          style={{
            padding: "9px 16px",
            borderRadius: 4,
            border: "none",
            background: "#111827",
            color: "#fff",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          Search
        </button>
      </form>

      <p style={hint}>
        Try: <em>Mazda, Accord, Grand Cherokee</em>
      </p>

      {loading && <p>Loading…</p>}
      {error && <p style={err}>Error: {error}</p>}

      {!loading && !error && (
        <>
          {results.length === 0 ? (
            <p>No results.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, marginTop: 8 }}>
              {results.map((r) => {
                const price = Number(r.price) || 0;
                const meta = r._vh || {};
                const total = meta.total;
                const monthly = meta.monthly;
                const down = meta.down;
                const term = meta.term;

                return (
                  <li
                    key={r.vin}
                    style={{
                      display: "flex",
                      gap: 16,
                      padding: "14px 0",
                      borderBottom: "1px solid #eee",
                      alignItems: "flex-start",
                    }}
                  >
                    {/* Thumbnail */}
                    <Link
                      to={`/vehicles/${r.vin}`}
                      style={{ display: "block", flexShrink: 0 }}
                    >
                      <div
                        style={{
                          width: 140,
                          height: 84,
                          background:
                            "url('https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&w=600') center/cover no-repeat",
                          borderRadius: 6,
                        }}
                      />
                    </Link>

                    {/* Main content */}
                    <div style={{ flex: 1 }}>
                      <Link
                        to={`/vehicles/${r.vin}`}
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: "#111827",
                          textDecoration: "none",
                        }}
                      >
                        {r.title ||
                          `${r.year} ${r.make} ${r.model}${
                            r.trim ? " " + r.trim : ""
                          }`}
                      </Link>

                      <div
                        style={{
                          fontSize: 12,
                          color: "#6b7280",
                          marginTop: 2,
                        }}
                      >
                        VIN: {r.vin}
                        {r.mileage && (
                          <>
                            {" "}
                            • {Number(r.mileage).toLocaleString()} miles
                          </>
                        )}
                        {r.location && <> • {r.location}</>}
                        {r.dealerName && <> • {r.dealerName}</>}
                      </div>

                      {/* Price + teaser row */}
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 14,
                          alignItems: "baseline",
                          marginTop: 6,
                          fontSize: 13,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: 600,
                              color: "#111827",
                            }}
                          >
                            {formatMoney(price)}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "#6b7280",
                            }}
                          >
                            Advertised price
                          </div>
                        </div>

                        {total && total > price && (
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 500,
                                color: "#111827",
                              }}
                            >
                              {formatMoney(total)}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: "#6b7280",
                              }}
                            >
                              Est. out-the-door (price + est. fees/tax/DMV)
                            </div>
                          </div>
                        )}

                        {monthly && monthly > 0 && (
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#111827",
                              }}
                            >
                              From {formatMoney(monthly)}/mo
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: "#6b7280",
                              }}
                            >
                              with {formatMoney(down)} down • {term} mo • est.
                              APR 7.5%
                            </div>
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 10,
                          color: "#93a3b8",
                        }}
                      >
                        Transparent fees preview. Exact totals & shipping on
                        vehicle page.
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
