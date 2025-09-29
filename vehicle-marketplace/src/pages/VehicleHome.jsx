import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getVehicle } from "../lib/api.js"; // <-- use the named helper

const h2 = { fontSize: "18px", margin: "18px 0 8px", fontWeight: 600 };
const err = { color: "crimson", marginTop: 10 };

export default function VehicleHome() {
  const { vin } = useParams();

  const [loading, setLoading] = useState(false);
  const [vehicle, setVehicle] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await getVehicle(vin);
        if (!cancel) setVehicle(data);
      } catch (e) {
        if (!cancel) setError(e?.message || String(e));
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [vin]);

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (error) return (
    <div style={{ padding: 24 }}>
      <h1>Vehicle Marketplace</h1>
      <p style={err}>Error: {error}</p>
      <p><Link to="/search">← Back to search</Link></p>
    </div>
  );
  if (!vehicle) return (
    <div style={{ padding: 24 }}>
      <h1>Vehicle Marketplace</h1>
      <p>No vehicle.</p>
      <p><Link to="/search">← Back to search</Link></p>
    </div>
  );

  const { year, make, model, trim, price, mileage, location, photos = [] } = vehicle;

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px" }}>
      <p><Link to="/search">← Back to search</Link></p>
      <h1>{year} {make} {model}{trim ? ` ${trim}` : ""}</h1>
      <div style={{ color: "#555", marginBottom: 10 }}>
        <strong>VIN:</strong> {vehicle.vin}
        {price != null ? <> • ${price}</> : null}
        {mileage != null ? <> • {Number(mileage).toLocaleString()} miles</> : null}
        {location ? <> • {location}</> : null}
      </div>

      <h2 style={h2}>Photos</h2>
      <div style={{ display: "flex", gap: 12 }}>
        {photos.length === 0 ? <div>No photos yet.</div> :
          photos.map((src, i) => (
            <img key={i} src={src} alt={`Photo ${i + 1}`} style={{ width: 260, height: 160, objectFit: "cover", borderRadius: 6 }} />
          ))
        }
      </div>

      <h2 style={h2}>Lien</h2>
      <div>No active lien reported.</div>

      <h2 style={h2}>Dealership Inspection</h2>
      <div>Not provided.</div>

      <h2 style={h2}>Compliance & Records</h2>
      <div>Smog: unknown • NMVTIS: brands unknown • Theft: unknown • KSR: Not provided</div>

      <h2 style={h2}>History</h2>
      <div>No history yet.</div>
    </div>
  );
}
