import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import http from "../lib/api.js";

export default function Search() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") || "");
  const navigate = useNavigate();
  const page = Number(searchParams.get("page") || "1");

  useEffect(() => {
    const term = searchParams.get("q") || "";
    if (!term) {
      setItems([]);
      setError("");
      return;
    }
    setError("");
    http
      .get(`/api/search?q=${encodeURIComponent(term)}&page=${page}`)
      .then((data) => setItems(data.results || []))
      .catch((e) => setError(`Error: ${e.message.replace(/\n/g, " ")}`));
  }, [searchParams, page]);

  function onSubmit(e) {
    e.preventDefault();
    setSearchParams({ q, page: "1" });
    navigate(`/search?q=${encodeURIComponent(q)}&page=1`);
  }

  return (
    <section style={{ maxWidth: 720, margin: "32px auto" }}>
      <h2>Find your next vehicle</h2>
      <form onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by make, model, VIN..."
          style={{ flex: 1 }}
        />
        <button type="submit">Search</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div style={{ marginTop: 16 }}>
        {items.map((v) => (
          <div key={v.vin} style={{ marginBottom: 16 }}>
            <Link to={`/vehicles/${v.vin}`}>
              {`${v.year} ${v.make} ${v.model}${v.trim ? " " + v.trim : ""}`}
            </Link>
            <div>{`VIN: ${v.vin} • ${v.mileage?.toLocaleString?.() || ""} miles • ${
              v.location || ""
            }`}</div>
            {"price" in v ? <div>${Number(v.price).toLocaleString()}</div> : null}
          </div>
        ))}
        {!error && items.length === 0 && (searchParams.get("q") ? <p>No results.</p> : null)}
      </div>
    </section>
  );
}
