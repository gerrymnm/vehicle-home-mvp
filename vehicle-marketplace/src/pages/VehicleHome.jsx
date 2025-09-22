import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { http } from "../lib/api.js";

export default function VehicleHome() {
  const { vin } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let dead = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await http.get(`/api/search?q=${encodeURIComponent(vin)}`);
        const match =
          res?.results?.find(
            (v) => String(v.vin).toUpperCase() === String(vin).toUpperCase()
          ) || null;
        if (!dead) setVehicle(match);
        if (!dead && !match) setError("Not found");
      } catch (e) {
        if (!dead) setError("Failed to load vehicle");
      } finally {
        if (!dead) setLoading(false);
      }
    }
    load();
    return () => {
      dead = true;
    };
  }, [vin]);

  return (
    <div style={{ padding: 16, maxWidth: 980, margin: "0 auto" }}>
      <small>Secured on blockchain</small>
      <div style={{ margin: "12px 0" }}>
        <Link to={`/search?q=${vin}`}>← Back to search</Link>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div style={{ color: "crimson" }}>Error: {error}</div>}
      {!loading && !error && !vehicle && <div>No vehicle.</div>}

      {vehicle && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
          <div>
            <h1 style={{ margin: "8px 0 12px" }}>
              {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
            </h1>
            <p>VIN: {vehicle.vin}</p>
            <p>
              {vehicle.price ? `$${vehicle.price.toLocaleString()}` : ""}
              {vehicle.mileage ? ` • ${vehicle.mileage.toLocaleString()} miles` : ""}
              {vehicle.location ? ` • ${vehicle.location}` : ""}
            </p>
            <p>Status: {vehicle.status || "In stock"}</p>

            <h3>History</h3>
            <p>No history yet.</p>
          </div>

          <aside
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: 12,
              height: "fit-content",
            }}
          >
            <h4 style={{ marginTop: 0 }}>Contact dealer</h4>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const body = {
                  vin: vehicle.vin,
                  name: fd.get("name"),
                  email: fd.get("email"),
                  phone: fd.get("phone"),
                  message: fd.get("message"),
                };
                try {
                  await http.post("/api/leads", body);
                  alert("Sent");
                  e.currentTarget.reset();
                } catch {
                  alert("Failed to send");
                }
              }}
            >
              <input name="name" placeholder="Your name" style={{ width: "100%", marginBottom: 8 }} />
              <input name="email" placeholder="Email" style={{ width: "100%", marginBottom: 8 }} />
              <input name="phone" placeholder="Phone" style={{ width: "100%", marginBottom: 8 }} />
              <textarea name="message" placeholder="Message" rows={5} style={{ width: "100%", marginBottom: 8 }} />
              <button type="submit" style={{ width: "100%" }}>Send</button>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}
