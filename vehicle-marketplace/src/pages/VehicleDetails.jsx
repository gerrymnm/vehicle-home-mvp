// vehicle-marketplace/src/pages/VehicleDetails.jsx
import React from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api.js";

export default function VehicleDetails() {
  const { vin = "" } = useParams();
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");
  const [vehicle, setVehicle] = React.useState(null);

  React.useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        // either api.vehicle or api.getByVin — both work
        const data = await api.getByVin(vin);
        if (!cancel) setVehicle(data.vehicle);
      } catch (e) {
        if (!cancel) setErr(e.message || String(e));
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [vin]);

  if (loading) return <div style={{ padding: 16 }}>Loading…</div>;
  if (err) {
    return (
      <div style={{ padding: 16 }}>
        <Link to="/search">← Back to search</Link>
        <p style={{ color: "crimson" }}>Error: {err}</p>
      </div>
    );
  }
  if (!vehicle) {
    return (
      <div style={{ padding: 16 }}>
        <Link to="/search">← Back to search</Link>
        <p>No vehicle found.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 16, maxWidth: 740 }}>
      <div style={{ marginBottom: 8 }}>
        <Link to="/search">← Back to search</Link>
      </div>

      <h2>
        {vehicle.title || `${vehicle.year ?? ""} ${vehicle.make ?? ""} ${vehicle.model ?? ""} ${vehicle.trim ?? ""}`.trim()}
      </h2>

      <p>VIN: {vehicle.vin}</p>
      <p>
        {vehicle.price ? `$${vehicle.price.toLocaleString()}` : null}
        {vehicle.mileage ? ` • ${vehicle.mileage.toLocaleString()} miles` : null}
        {vehicle.location ? ` • ${vehicle.location}` : null}
      </p>
      <p>Status: {vehicle.in_stock ? "In stock" : "Unavailable"}</p>

      <h4>Photos</h4>
      {/* You can wire this up later to api.photos(vin) */}
      <p>No photos yet.</p>

      <h4>Compliance & Records</h4>
      <p>Smog: unknown</p>
      <p>NMVTIS: brands unknown • Theft: unknown</p>
      <p>KSR: Not provided</p>
    </div>
  );
}
