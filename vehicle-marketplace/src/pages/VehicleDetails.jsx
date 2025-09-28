import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../lib/api.js";
import PhotoGrid from "../components/PhotoGrid.jsx";
import History from "../components/History.jsx";

export default function VehicleDetails() {
  const { vin } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");

    Promise.all([api.vehicle(vin), api.photos(vin)])
      .then(([v, p]) => {
        if (!alive) return;
        // backend returns { ok, vehicle, history? } per our routes
        const veh = v?.vehicle ?? v;
        setVehicle(veh || null);
        setPhotos(Array.isArray(p?.photos) ? p.photos : Array.isArray(p) ? p : []);
      })
      .catch((e) => alive && setErr(e?.message || "Failed to load vehicle"))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [vin]);

  if (loading) return <p style={{ color: "#666" }}>Loading…</p>;
  if (err) return <p style={{ color: "crimson" }}>Error: {err}</p>;
  if (!vehicle) return <p>No vehicle found.</p>;

  const { year, make, model, trim, price, mileage, location, in_stock } = vehicle;

  return (
    <div>
      <p>
        <Link to={`/search?q=${encodeURIComponent(make || "")}`}>← Back to search</Link>
      </p>

      <h2 style={{ margin: "8px 0 4px" }}>
        {year} {make} {model} {trim ? <span>{trim}</span> : null}
      </h2>
      <p style={{ margin: "0 0 12px", color: "#444" }}>
        VIN: {vin}
        {price != null && ` • $${Number(price).toLocaleString()}`}
        {mileage != null && ` • ${Number(mileage).toLocaleString()} miles`}
        {location ? ` • ${location}` : ""}
        {typeof in_stock === "boolean" ? ` • Status: ${in_stock ? "in stock" : "sold"}` : ""}
      </p>

      <section>
        <h3>Photos</h3>
        <PhotoGrid photos={photos} />
      </section>

      <section style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 8 }}>Lien</h3>
        <p style={{ color: "#666" }}>No active lien reported.</p>
      </section>

      <section style={{ marginTop: 12 }}>
        <h3 style={{ marginBottom: 8 }}>Dealership Inspection</h3>
        <p style={{ color: "#666" }}>Not provided.</p>
      </section>

      <section style={{ marginTop: 12 }}>
        <h3 style={{ marginBottom: 8 }}>Compliance &amp; Records</h3>
        <p style={{ margin: 0, color: "#666" }}>
          Smog: unknown
          <br />
          NMVTIS: brands unknown • Theft: unknown
          <br />
          KSR: Not provided
        </p>
      </section>

      <section style={{ marginTop: 20 }}>
        <History vin={vin} />
      </section>
    </div>
  );
}
