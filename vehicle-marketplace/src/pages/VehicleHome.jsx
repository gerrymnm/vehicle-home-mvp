// Full file: vehicle-marketplace/src/pages/VehicleHome.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../lib/api.js"; // default import; file also provides named { api }

const h2 = { fontSize: "18px", margin: "18px 0 8px", fontWeight: 600 };
const small = { fontSize: "12px", color: "#666" };

export default function VehicleHome() {
  const { vin } = useParams();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setErr(null);
      try {
        // details
        const v = await api.vehicle(vin); // alias calls getVehicle
        if (cancelled) return;

        // photos + history in parallel
        const [ph, hi] = await Promise.all([
          api.photos(vin).catch(() => ({ ok: true, photos: [] })), // tolerate absence
          api.history(vin, "all").catch(() => ({ ok: true, events: [] })),
        ]);

        if (cancelled) return;
        setVehicle(v?.vehicle || v?.data || v || null);
        setPhotos(ph?.photos || []);
        setHistory(hi?.events || []);
      } catch (e) {
        if (!cancelled) setErr(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [vin]);

  const title = useMemo(() => {
    if (!vehicle) return "";
    const { year, make, model, trim } = vehicle;
    return [year, make, model, trim].filter(Boolean).join(" ");
  }, [vehicle]);

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (err) return (
    <div style={{ padding: 24, color: "crimson" }}>Error: {err}</div>
  );
  if (!vehicle) return <div style={{ padding: 24 }}>Not found.</div>;

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "16px 20px" }}>
      <div style={{ marginBottom: 8 }}>
        <Link to="/search">← Back to search</Link>
      </div>

      <h1 style={{ fontSize: 22, margin: "8px 0 4px" }}>{title}</h1>
      <p style={{ margin: 0 }}>
        <strong>VIN:</strong> {vehicle.vin}
        {vehicle.price ? ` • $${Number(vehicle.price).toLocaleString()}` : ""}
        {vehicle.mileage ? ` • ${Number(vehicle.mileage).toLocaleString()} miles` : ""}
        {vehicle.location ? ` • ${vehicle.location}` : ""}
      </p>
      <p style={{ ...small, marginTop: 6 }}>
        Status: {vehicle.in_stock ? "in stock" : "not in stock"}
      </p>

      <h2 style={h2}>Photos</h2>
      {photos.length === 0 ? (
        <p style={small}>No photos yet.</p>
      ) : (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {photos.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Photo ${i + 1}`}
              style={{ width: 280, height: 180, objectFit: "cover", borderRadius: 6 }}
            />
          ))}
        </div>
      )}

      <h2 style={h2}>Lien</h2>
      <p style={small}>No active lien reported.</p>

      <h2 style={h2}>Dealership Inspection</h2>
      <p style={small}>Not provided.</p>

      <h2 style={h2}>Compliance & Records</h2>
      <p style={small}>
        Smog: unknown • NMVTIS: brands unknown • Theft: unknown<br />
        KSR: Not provided
      </p>

      <h2 style={h2}>History</h2>
      {history.length === 0 ? (
        <p style={small}>No history yet.</p>
      ) : (
        <ul>
          {history.map((e, i) => (
            <li key={i}>
              <span style={small}>
                {e.date || e.occurred_at || ""} • {e.type || "event"}
              </span>{" "}
              {e.title || e.description || ""}
            </li>
          ))}
        </ul>
      )}

      <div style={{ marginTop: 24 }}>
        <Link to="/search">Search</Link>{" "}
        <Link to="/dealer" style={{ marginLeft: 12 }}>Dealer</Link>{" "}
        <Link to="/login" style={{ marginLeft: 12 }}>Login</Link>
      </div>
    </div>
  );
}
