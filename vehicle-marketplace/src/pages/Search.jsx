// Full file: vehicle-marketplace/src/pages/Search.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { searchVehicles } from "../lib/api";

export default function Search() {
  const [sp, setSp] = useSearchParams();
  const qParam = sp.get("q") ?? "";
  const pageParam = Number(sp.get("page") || "1");

  const [q, setQ] = useState(qParam);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState({ results: [], totalPages: 1, page: 1 });

  const canSearch = useMemo(() => q.trim().length > 0, [q]);

  useEffect(() => { setQ(qParam); }, [qParam]);

  useEffect(() => {
    const term = qParam.trim();
    if (!term) {
      setData({ results: [], totalPages: 1, page: 1 });
      setErr("");
      return;
    }
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const resp = await searchVehicles({ q: term, page: pageParam, pageSize: 20 });
        setData({
          results: resp.results ?? [],
          totalPages: resp.totalPages ?? 1,
          page: resp.query?.page ?? pageParam,
        });
      } catch (e) {
        setErr(String(e.message || e));
        setData({ results: [], totalPages: 1, page: 1 });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [qParam, pageParam]);

  function submit(e) {
    e?.preventDefault();
    setSp(prev => {
      const p = new URLSearchParams(prev);
      if (q.trim()) p.set("q", q.trim()); else p.delete("q");
      p.set("page", "1");
      return p;
    });
  }

  function gotoPage(p) {
    setSp(prev => {
      const s = new URLSearchParams(prev);
      s.set("page", String(p));
      if (!s.get("q")) s.set("q", q.trim());
      return s;
    });
  }

  return (
    <div>
      <h2>Find your next vehicle</h2>

      <form onSubmit={submit} className="bar" style={{ maxWidth: 820 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="make, model, trim…"
          aria-label="search"
          style={{ flex: 1, minWidth: 260 }}
        />
        <button type="submit" disabled={!canSearch}>Search</button>
      </form>

      <p className="muted" style={{ fontSize: 12 }}>Try: Mazda, Accord, Grand Cherokee</p>

      {loading && <p>Loading…</p>}
      {err && <p style={{ color: "crimson" }}>Error: {err}</p>}
      {!loading && !err && data.results.length === 0 && <p>No results.</p>}

      <ul style={{ paddingLeft: 18 }}>
        {data.results.map((r) => (
          <li key={r.vin} style={{ marginBottom: 10 }}>
            <Link to={`/vehicles/${r.vin}`}>
              {r.title ?? [r.year, r.make, r.model, r.trim].filter(Boolean).join(" ")}
            </Link>
            <br />
            <span className="muted" style={{ fontSize: 12 }}>
              VIN: {r.vin}
              {r.mileage ? <> • {Number(r.mileage).toLocaleString()} miles</> : null}
              {r.location ? <> • {r.location}</> : null}
              {r.price ? <> • ${Number(r.price).toLocaleString()}</> : null}
            </span>
          </li>
        ))}
      </ul>

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="bar">
          <button disabled={data.page <= 1} onClick={() => gotoPage(data.page - 1)}>Prev</button>
          <span>Page {data.page} / {data.totalPages}</span>
          <button disabled={data.page >= data.totalPages} onClick={() => gotoPage(data.page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
