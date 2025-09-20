import React from "react";
import { useParams } from "react-router-dom";
import { http } from "../lib/api.js";

export default function VehicleDetails() {
  const { vin } = useParams();
  const [v, setV] = React.useState(null);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    (async () => {
      try {
        const data = await http.get(`/api/vehicles/${encodeURIComponent(vin)}`);
        setV(data);
      } catch (e) {
        setErr("Vehicle not found");
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
      </div>
    </section>
  );
}
