import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api.js";

const section = { margin: "24px 0" };
const h2 = { fontSize: 18, fontWeight: 700, margin: "24px 0 8px" };
const small = { color: "#555" };

function PhotosGrid({ photos }) {
  if (!photos?.length) return <p style={small}>No photos yet.</p>;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))",
        gap: 12,
      }}
    >
      {photos.map((p, i) => (
        <figure key={i} style={{ margin: 0 }}>
          <img
            src={p.url}
            alt={p.caption || `Photo ${i + 1}`}
            style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 6 }}
            loading="lazy"
          />
          {p.caption ? <figcaption style={{ ...small, marginTop: 4 }}>{p.caption}</figcaption> : null}
        </figure>
      ))}
    </div>
  );
}

function History({ vin }) {
  const [type, setType] = useState("all");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const load = async (t) => {
    try {
      setErr("");
      setLoading(true);
      const data = await api.vehicles.getHistory(vin, t);
      setEvents(data?.events || []);
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(type);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vin, type]);

  return (
    <div style={section}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h3 style={h2}>History</h3>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All</option>
          <option value="maintenance">Maintenance</option>
          <option value="accident">Accident / Damage</option>
          <option value="ownership">Ownership</option>
        </select>
      </div>

      {loading ? <p>Loading…</p> : null}
      {err ? <p style={{ color: "crimson" }}>Error: {err}</p> : null}

      {!loading && !err && events.length === 0 ? (
        <p style={small}>No history yet.</p>
      ) : (
        <ul style={{ paddingLeft: 18, marginTop: 8 }}>
          {events.map((e) => (
            <li key={e.id} style={{ marginBottom: 8 }}>
              <div>
                <strong>{e.title}</strong>{" "}
                <span style={small}>
                  • {new Date(e.at).toLocaleDateString()} • {e.type}
                </span>
              </div>
              {e.detail ? <div style={small}>{e.detail}</div> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function VehicleHome() {
  const { vin } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => {
    if (!vehicle) return "Vehicle";
    const bits = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean);
    return bits.join(" ");
  }, [vehicle]);

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);
        const d = await api.vehicles.getByVin(vin);
        setVehicle(d?.vehicle ?? null);
        const p = await api.vehicles.getPhotos(vin);
        setPhotos(p?.photos || []);
      } catch (e) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [vin]);

  if (loading && !vehicle) return <p>Loading…</p>;
  if (err) {
    return (
      <div>
        <p style={{ marginTop: 12 }}>
          <span style={{ ...small, display: "block" }}>Secured on blockchain</span>
          <Link to="/search">← Back to search</Link>
        </p>
        <p style={{ color: "crimson" }}>Error: {err}</p>
      </div>
    );
  }

  if (!vehicle) return <p>Vehicle not found.</p>;

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 12px" }}>
      <p style={{ marginBottom: 8 }}>
        <span style={{ ...small, display: "block" }}>Secured on blockchain</span>
        <Link to="/search">← Back to search</Link>
      </p>

      <h1 style={{ fontSize: 22, margin: "6px 0" }}>{title}</h1>
      <p style={small}>
        VIN: {vehicle.vin} •{" "}
        {vehicle.price ? `$${Number(vehicle.price).toLocaleString()}` : "—"} •{" "}
        {vehicle.mileage ? `${Number(vehicle.mileage).toLocaleString()} miles` : "—"} •{" "}
        {vehicle.location || "—"}
      </p>
      <p style={small}>Status: {vehicle.status || "—"}</p>

      {/* Photos */}
      <div style={section}>
        <h3 style={h2}>Photos</h3>
        <PhotosGrid photos={photos} />
      </div>

      {/* Lien placeholder (unchanged for this drop) */}
      <div style={section}>
        <h3 style={h2}>Lien</h3>
        <p style={small}>No active lien reported.</p>
      </div>

      {/* Dealership Inspection placeholder */}
      <div style={section}>
        <h3 style={h2}>Dealership Inspection</h3>
        <p style={small}>Not provided.</p>
      </div>

      {/* Compliance block (unchanged placeholders) */}
      <div style={section}>
        <h3 style={h2}>Compliance & Records</h3>
        <p style={small}>Smog: unknown</p>
        <p style={small}>NMVTIS: brands unknown • Theft: unknown</p>
        <p style={small}>KSR: Not provided</p>
      </div>

      {/* History with filter */}
      <History vin={vin} />
    </div>
  );
}
