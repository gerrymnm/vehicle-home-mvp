import React from "react";
import { useParams } from "react-router-dom";
import { http } from "../lib/api.js";

export default function VehicleDetails() {
  const { vin } = useParams();
  const [v, setV] = React.useState(null);
  const [events, setEvents] = React.useState([]);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const data = await http.get(`/api/vehicles/${encodeURIComponent(vin)}`);
        setV(data);
      } catch {
        setErr("Vehicle not found");
      }
      try {
        const ev = await http.get(`/api/vehicles/${encodeURIComponent(vin)}/events`);
        setEvents(ev.events || []);
      } catch {
        // ignore
      }
    })();
  }, [vin]);

  if (err) return <div style={{maxWidth:900, margin:"24px auto"}}>{err}</div>;
  if (!v) return <div style={{maxWidth:900, margin:"24px auto"}}>Loading…</div>;

  return (
    <section style={{maxWidth:900, margin:"24px auto"}}>
      <h2>{v.year} {v.make} {v.model}{v.trim ? ` ${v.trim}` : ""}</h2>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
        <div>
          <div><strong>VIN:</strong> {v.vin}</div>
          <div><strong>Mileage:</strong> {v.mileage?.toLocaleString() ?? "—"}</div>
          <div><strong>Price:</strong> {v.price ? `$${v.price.toLocaleString()}` : "—"}</div>
          <div><strong>Location:</strong> {v.location || "—"}</div>
          <div><strong>Status:</strong> {v.inStock ? "In stock" : "Off market"}</div>
        </div>
        <div>
          <h3 style={{marginTop:0}}>Recent Activity</h3>
          {events.length === 0 ? (
            <div style={{opacity:.7}}>No recent events.</div>
          ) : (
            <ul style={{listStyle:"none", padding:0, margin:0}}>
              {events.slice(0,20).map(e => (
                <li key={e.id} style={{padding:"6px 0", borderBottom:"1px solid #eee"}}>
                  <div style={{fontSize:13, opacity:.75}}>
                    {new Date(e.timestamp).toLocaleString()} • {e.type}
                  </div>
                  {e.note && <div style={{fontSize:14}}>{e.note}</div>}
                  {e.payload && <pre style={{margin:0, fontSize:12, background:"#f7f7f7", padding:6, overflow:"auto"}}>{JSON.stringify(e.payload, null, 2)}</pre>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
