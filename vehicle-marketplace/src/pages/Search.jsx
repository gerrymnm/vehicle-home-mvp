import React from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { http } from "../lib/api.js";

export default function Search() {
  const [sp] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = React.useState({
    items: [],
    loading: false,
    error: null,
    total: 0,
    page: 1,
    totalPages: 0,
  });

  const q = sp.get("q") || "";
  const page = Number(sp.get("page") || "1");

  React.useEffect(() => {
    if (!q) {
      setState((s) => ({ ...s, items: [], total: 0, totalPages: 0, error: null }));
      return;
    }
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    http
      .get(`/api/search?q=${encodeURIComponent(q)}&page=${page}`)
      .then((data) => {
        if (!alive) return;
        setState({
          items: data.results || [],
          loading: false,
          error: null,
          total: data.total || 0,
          page: data.query?.page || page,
          totalPages: data.totalPages || 1,
        });
      })
      .catch((err) => {
        if (!alive) return;
        setState((s) => ({ ...s, loading: false, error: String(err) }));
      });
    return () => {
      alive = false;
    };
  }, [q, page]);

  function onSubmit(e) {
    e.preventDefault();
    const value = e.currentTarget.querySelector('input[name="q"]').value.trim();
    const params = new URLSearchParams();
    if (value) params.set("q", value);
    params.set("page", "1");
    navigate(`/search?${params.toString()}`);
  }

  return (
    <section style={{ maxWidth: 900, margin: "24px auto" }}>
      <h2>Find your next vehicle</h2>
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by make, model, VIN..."
          style={{ flex: 1, padding: "8px" }}
        />
        <button type="submit">Search</button>
      </form>

      {state.loading && <p>Loading...</p>}
      {state.error && <p style={{ color: "red" }}>Error: {state.error}</p>}
      {!state.loading && !state.error && state.items.length === 0 && q && <p>No results.</p>}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {state.items.map((v) => (
          <li key={v.vin} style={{ padding: "12px 0", borderBottom: "1px solid #eee" }}>
            <Link to={`/vehicles/${encodeURIComponent(v.vin)}`} style={{ fontWeight: 600 }}>
              {v.year} {v.make} {v.model} {v.trim || ""}
            </Link>
            <div>
              VIN: {v.vin} • {v.mileage ? `${Number(v.mileage).toLocaleString()} miles` : ""} •{" "}
              {v.location || ""}
            </div>
            <div>{v.price ? `$${Number(v.price).toLocaleString()}` : ""}</div>
          </li>
        ))}
      </ul>

      {state.totalPages > 1 && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button disabled={page <= 1} onClick={() => navigate(`/search?q=${encodeURIComponent(q)}&page=${page - 1}`)}>
            Prev
          </button>
          <span>
            Page {page} of {state.totalPages}
          </span>
          <button
            disabled={page >= state.totalPages}
            onClick={() => navigate(`/search?q=${encodeURIComponent(q)}&page=${page + 1}`)}
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
