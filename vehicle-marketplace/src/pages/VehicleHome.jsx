// vehicle-marketplace/src/pages/VehicleHome.jsx
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api.js";

const h2 = { fontSize: "18px", margin: "18px 0 8px", fontWeight: 600 };
const small = { fontSize: "13px", color: "#444", margin: "2px 0" };
const errCss = { color: "#b00020", marginTop: 16 };

export default function VehicleHome() {
  const { vin } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let on = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        // vehicle
        const v = await api.vehicle(vin);
        // backend may return {ok:true, vehicle:{...}} or just the object
        const vObj = v?.vehicle ?? v;
        if (on) setVehicle(vObj || null);

        // photos (mock)
        try {
          const ph = await api.photos(vin);
          if (on) setPhotos(Array.isArray(ph?.photos) ? ph.photos : []);
        } catch {
          if (on) setPhotos([]);
        }

        // history (mock)
        try {
          const h = await api.history(vin, "all");
          if (on) setHistory(Array.isArray(h?.events) ? h.events : []);
        } catch {
          if (on) setHistory([]);
        }
      } catch (e) {
        if (on) setErr(e.message || String(e));
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [vin]);

  if (loading) return <p style={small}>Loading…</p>;

  if (err) {
    return (
      <div>
        <p><Link to={`/search?q=${encodeURIComponent(vin ?? "")}`}>&larr; Back to search</Link></p>
        <p style={errCss}>Error: {err}</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div>
        <p><Link to="/search">&larr; Back to search</Link></p>
        <p style={errCss}>No vehicle found.</p>
      </div>
    );
  }

  const {
    year, make, model, trim, price, mileage, location, status
  } = vehicle;

  return (
    <div>
      <p><Link to={`/search?q=${encodeURIComponent(make || "")}`}>&larr; Back to search</Link></p>

      <h2 style={{ fontSize: 22, margin: "10px 0 6px" }}>
        {year} {make} {model} {trim}
      </h2>
      <p style={small}>
        VIN: {vin} • {price ? `$${Number(price).toLocaleString()}` : "—"} •{" "}
        {mileage ? `${Number(mileage).toLocaleString()} miles` : "—"} •{" "}
        {location || "—"}
      </p>
      <p style={small}>Status: {status ? String(status) : "—"}</p>

      <div style={{ marginTop: 16 }}>
        <h3 style={h2}>Photos</h3>
        {photos.length === 0 ? (
          <p style={small}>No photos yet.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, 160px)", gap: 12 }}>
            {photos.map((src, i) => (
              <img key={i} src={src} alt={`photo ${i+1}`} style={{ width: 160, height: 100, objectFit: "cover", border: "1px solid #eee" }} />
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <h3 style={h2}>Lien</h3>
        <p style={small}>No active lien reported.</p>

        <h3 style={h2}>Dealership Inspection</h3>
        <p style={small}>Not provided.</p>

        <h3 style={h2}>Compliance & Records</h3>
        <p style={small}>Smog: unknown</p>
        <p style={small}>NMVTIS: brands unknown • Theft: unknown</p>
        <p style={small}>KSR: Not provided</p>
      </div>

      <div style={{ marginTop: 16 }}>
        <h3 style={h2}>History</h3>
        {history.length === 0 ? (
          <p style={small}>No history yet.</p>
        ) : (
          <ul style={{ paddingLeft: 18, margin: 0 }}>
            {history.map((e, i) => (
              <li key={i} style={small}>
                {e.date ?? "—"} • {e.type ?? "event"} • {e.note ?? ""}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
