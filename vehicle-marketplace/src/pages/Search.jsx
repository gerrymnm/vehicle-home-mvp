import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { http } from "../lib/api.js";

export default function Search() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState({ results: [], total: 0 });

  async function load() {
    setLoading(true);
    try {
      const json = await http.get(`/api/vehicles?q=${encodeURIComponent(q)}`);
      setData(json);
    } catch (e) {
      console.error(e);
      setData({ results: [], total: 0 });
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, [q]);

  function onSubmit(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setParams({ q: form.get("q") || "" });
  }

  return (
    <section style={{maxWidth:1000, margin:"24px auto"}}>
      <form onSubmit={onSubmit} style={{display:"flex", gap:8}}>
        <input name="q" defaultValue={q} placeholder="Search…" style={{flex:1,padding:"10px 12px"}} />
        <button>Search</button>
      </form>

      <div style={{marginTop:16}}>
        {loading ? <div>Loading…</div> : (
          <>
            <div style={{marginBottom:8, opacity:.7}}>
              {data.total ?? data.results.length} results
            </div>
            <ul style={{listStyle:"none", padding:0}}>
              {data.results.map(v => (
                <li key={v.vin} style={{display:"grid", gridTemplateColumns:"1fr auto", gap:8, padding:"10px 0", borderBottom:"1px solid #eee"}}>
                  <div>
                    <Link to={`/vehicles/${v.vin}`} style={{fontWeight:600}}>
                      {v.year} {v.make} {v.model}{v.trim ? ` ${v.trim}` : ""}
                    </Link>
                    <div style={{opacity:.75, fontSize:14}}>
                      VIN {v.vin} • {v.mileage ? `${v.mileage.toLocaleString()} mi` : "—"} • {v.location || "—"}
                    </div>
                  </div>
                  <div style={{textAlign:"right", minWidth:120}}>
                    <div style={{fontWeight:700}}>{v.price ? `$${v.price.toLocaleString()}` : "—"}</div>
                    <div style={{fontSize:12, opacity:.7}}>{v.inStock ? "In stock" : "Off market"}</div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  );
}
