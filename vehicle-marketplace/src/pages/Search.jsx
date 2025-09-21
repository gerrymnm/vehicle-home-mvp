import React from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { http } from "../lib/api.js";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [q, setQ] = React.useState(params.get("q") || "");
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState("");

  function onSubmit(e) {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (q) next.set("q", q); else next.delete("q");
    navigate(`/search?${next.toString()}`);
  }

  React.useEffect(() => {
    const query = params.get("q") || "";
    const page = Number(params.get("page") || 1);
    const size = Number(params.get("size") || 20);
    const sort = params.get("sort") || "recent";
    setLoading(true);
    setErr("");
    http.get(`/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}&sort=${encodeURIComponent(sort)}`)
      .then(data => setRows(Array.isArray(data.rows) ? data.rows : (Array.isArray(data) ? data : [])))
      .catch(e => { setErr(String(e)); setRows([]); })
      .finally(() => setLoading(false));
  }, [params]);

  return (
    <div style={{maxWidth:900, margin:"40px auto"}}>
      <h2>Find your next vehicle</h2>
      <form onSubmit={onSubmit} style={{display:"flex", gap:8}}>
        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          placeholder="Search by make, model, VIN…"
          style={{flex:1, padding:8}}
        />
        <button>Search</button>
      </form>

      {loading && <p style={{marginTop:16}}>Searching…</p>}
      {err && <p style={{marginTop:16, color:"crimson"}}>{err}</p>}

      <div style={{marginTop:24, display:"grid", gap:12}}>
        {rows.map(v => (
          <div key={v.vin} style={{border:"1px solid #ddd", padding:12, borderRadius:8}}>
            <div style={{fontWeight:600}}>{[v.year, v.make, v.model, v.trim].filter(Boolean).join(" ")}</div>
            <div>VIN: {v.vin}</div>
            <div>Price: {v.price ? `$${Number(v.price).toLocaleString()}` : "—"}</div>
            <div>Mileage: {v.mileage ? Number(v.mileage).toLocaleString() : "—"}</div>
            <div style={{marginTop:8}}>
              <Link to={`/vehicles/${encodeURIComponent(v.vin)}`}>View details</Link>
            </div>
          </div>
        ))}
        {!loading && !err && rows.length === 0 && <p>No results.</p>}
      </div>
    </div>
  );
}
