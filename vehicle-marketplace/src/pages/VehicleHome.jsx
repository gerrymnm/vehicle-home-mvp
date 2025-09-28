// Full file: vehicle-marketplace/src/pages/VehicleHome.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../lib/api.js";
import History from "../components/History.jsx";

const wrap = {
  maxWidth: 900,
  margin: "24px auto",
  padding: "0 16px",
};
const h1 = { fontSize: "24px", fontWeight: 700, margin: "8px 0 16px" };
const label = { fontWeight: 600, marginTop: 16 };
const photoBox = {
  display: "flex",
  gap: 16,
  flexWrap: "wrap",
};
const imgStyle = { width: 270, height: 160, objectFit: "cover", borderRadius: 8, border: "1px solid #ddd" };

export default function VehicleHome() {
  const { vin } = useParams();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);
  const [photos, setPhotos] = useState([]);

  const title = useMemo(() => {
    if (!data) return "Vehicle Marketplace";
    const t = data.title || `${data.year ?? ""} ${data.make ?? ""} ${data.model ?? ""}`.trim();
    return t || "Vehicle Marketplace";
  }, [data]);

  useEffect(() => {
    async function load() {
      if (!vin) return;
      setLoading(true);
      setErr("");
      try {
        const v = await api.vehicle(vin);
        if (!v || v.ok === false) throw new Error(v?.error || "Failed to load vehicle");
        setData(v.vehicle || v); // accept either shape
        // Optional photos endpoint (mocked/static ok)
        try {
          const ph = await api.vehiclePhotos(vin);
          setPhotos(Array.isArray(ph?.photos) ? ph.photos : []);
        } catch {
          setPhotos([]);
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [vin]);

  return (
    <div style={wrap}>
      <div style={{ marginBottom: 12 }}>
        <Link to="/search">← Back to search</Link>
      </div>

      <h1 style={h1}>{title}</h1>

      {loading && <div>Loading…</div>}
      {!loading && err && <div style={{ color: "#b00020" }}>Error: {err}</div>}

      {!loading && !err && data && (
        <>
          <div style={{ marginBottom: 8 }}>
            <div>
              <strong>VIN:</strong>{" "}
              <span style={{ fontFamily: "monospace" }}>{data.vin}</span>{" "}
              • {data.price ? `$${Number(data.price).toLocaleString()}` : "—"} •{" "}
              {data.mileage?.toLocaleString?.() ?? data.mileage ?? "—"} miles •{" "}
              {data.location ?? "—"}
            </div>
            <div>Status: {data.in_stock ? "in stock" : "not in stock"}</div>
          </div>

          <div style={label}>Photos</div>
          <div style={photoBox}>
            {photos.length === 0 && <div>No photos yet.</div>}
            {photos.map((src, i) => (
              <img key={`${src}-${i}`} src={src} alt={`photo ${i + 1}`} style={imgStyle} />
            ))}
          </div>

          <div style={label}>Lien</div>
          <div>No active lien reported.</div>

          <div style={label}>Dealership Inspection</div>
          <div>Not provided.</div>

          <div style={label}>Compliance & Records</div>
          <div style={{ fontSize: 14 }}>
            Smog: unknown<br />
            NMVTIS: brands unknown • Theft: unknown<br />
            KSR: Not provided
          </div>

          <div style={label}>History</div>
          <History vin={data.vin} />
        </>
      )}
    </div>
  );
}
