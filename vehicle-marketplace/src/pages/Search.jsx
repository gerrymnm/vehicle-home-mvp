import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../lib/api.js";

export default function Search() {
  const [sp, setSp] = useSearchParams();
  const q = (sp.get("q") || "").trim();
  const page = Number(sp.get("page") || 1);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const [meta, setMeta] = useState({ count: 0, total: 0, totalPages: 0 });

  // Simple helper so we can update URL query params
  const updateQuery = (nextQ) => {
    const next = new URLSearchParams(sp);
    if (nextQ) next.set("q", nextQ);
    else next.delete("q");
    next.set("page", "1");
    setSp(next, { replace: false });
  };

  const doSearch = async () => {
    if (!q) {
      setResults([]);
      setMeta({ count: 0, total: 0, totalPages: 0 });
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Warm-up ping first (helps with free Render cold start)
      try { await api.health(); } catch {}

      const r = await api.search(q, page, 20);

      // Validate shape strictly; if not JSON with `results`, surface as error
      if (!r || !Array.isArray(r.results)) {
        // Show a helpful snippet of whatever we got back
        const snippet =
          typeof r === "object" ? JSON.stringify(r).slice(0, 200) : String(r).slice(0, 200);
        throw new Error(`Unexpected response: ${snippet}`);
      }

      setResults(r.results);
      setMeta({
        count: Number(r.count ?? r.results?.length ?? 0),
        total: Number(r.total ?? r.results?.length ?? 0),
        totalPages: Number(r.totalPages ?? 1),
      });
    } catch (e) {
      setResults([]);
      setMeta({ count: 0, total: 0, totalPages: 0 });
      setError(e?.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  // Run search whenever q/page changes
  useEffect(() => {
    doSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, page]);

  // Small form state (controlled input)
  const [text, setText] = useState(q);
  useEffect(() => setText(q), [q]);

  const apiBase = useMemo(() => api.base, []);

  return (
    <div style={{ maxWidth: 800, margin: "32px auto", padding: "0 16px" }}>
      <h2>Find your next vehicle</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateQuery(text.trim());
        }}
        style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mazda, Accord, Grand Cherokee"
          style={{ flex: 1, padding: "6px 10px" }}
        />
        <button type="submit" disabled={loading} style={{ padding: "6px 12px" }}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Tiny diagnostics so we can see what URL the frontend is using */}
      <div style={{ fontSize: 12, color: "#666", marginBottom: 12 }}>
        API: <code>{apiBase}</code> • Query: <code>{q || "(empty)"}</code> • Page: <code>{page}</code>
      </div>

      {error && (
        <p style={{ color: "crimson", marginTop: 8 }}>
          <strong>Error:</strong> {error}
        </p>
      )}

      {!error && !loading && results.length === 0 && q && <p>No results.</p>}

      {!error && results.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
          {results.map((v) => (
            <li key={v.vin} style={{ marginBottom: 16 }}>
              <Link to={`/vehicles/${encodeURIComponent(v.vin)}`} style={{ fontWeight: "bold" }}>
                {v.title || `${v.year ?? ""} ${v.make ?? ""} ${v.model ?? ""} ${v.trim ?? ""}`.trim()}
              </Link>
              <div style={{ fontSize: 13, color: "#444" }}>
                VIN: {v.vin}
                {typeof v.mileage === "number" ? ` • ${v.mileage.toLocaleString()} miles` : ""}
                {typeof v.price === "number" ? ` • $${v.price.toLocaleString()}` : ""}
                {v.location ? ` • ${v.location}` : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
