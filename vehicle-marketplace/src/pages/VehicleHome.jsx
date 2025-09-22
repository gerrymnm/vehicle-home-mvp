import React, { useEffect, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { apiUrl } from "../lib/api.js";

export default function VehicleHome() {
  const { vin: vinFromPath } = useParams();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const vin = vinFromPath || params.get("q") || "";

  const [vehicle, setVehicle] = useState(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setError("");
        setVehicle(null);
        if (!vin) return;
        const res = await fetch(
          apiUrl(`/api/search?q=${encodeURIComponent(vin)}`),
          { credentials: "omit" }
        );
        if (!res.ok) throw new Error(`Search failed (${res.status})`);
        const data = await res.json();
        const v = data?.results?.[0] || null;
        if (!v) {
          setError("Not found");
          return;
        }
        setVehicle(v);
      } catch (e) {
        setError(e?.message || "Failed to load vehicle");
      }
    }
    load();
  }, [vin]);

  async function submitLead(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      vin: vehicle?.vin || vin,
      name: form.get("name") || "",
      email: form.get("email") || "",
      phone: form.get("phone") || "",
      message: form.get("message") || "",
    };
    try {
      setSending(true);
      const res = await fetch(apiUrl("/api/leads"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to submit lead");
      alert("Thanks! Your message was sent.");
      e.currentTarget.reset();
    } catch (err) {
      alert(err.message || "Failed to submit lead");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <Link to="/search">← Back to search</Link>
      </div>

      {!vin && <div>Provide a VIN to view details.</div>}
      {error && <div style={{ color: "red" }}>Error: {error}</div>}
      {!error && !vehicle && vin && <div>Loading…</div>}

      {vehicle && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>
              {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim || ""}
            </h1>
            <div style={{ marginBottom: 6 }}>VIN: {vehicle.vin}</div>
            <div style={{ marginBottom: 6 }}>
              ${vehicle.price?.toLocaleString?.() || "—"}
            </div>
            <div style={{ marginBottom: 6 }}>
              {vehicle.mileage?.toLocaleString?.()} miles • {vehicle.location || "—"}
            </div>
            <div style={{ marginBottom: 6 }}>
              Status: {vehicle.status || "In stock"}
            </div>

            <h3 style={{ marginTop: 18, marginBottom: 8 }}>History</h3>
            <div>No history yet.</div>
          </div>

          <aside>
            <form onSubmit={submitLead} style={{ border: "1px solid #ddd", borderRadius: 6, padding: 12 }}>
              <div style={{ fontWeight: "bold", marginBottom: 8 }}>Contact dealer</div>
              <input name="name" placeholder="Your name" style={{ width: "100%", padding: 8, marginBottom: 8 }} />
              <input name="email" placeholder="Email" style={{ width: "100%", padding: 8, marginBottom: 8 }} />
              <input name="phone" placeholder="Phone" style={{ width: "100%", padding: 8, marginBottom: 8 }} />
              <textarea name="message" placeholder="Message" rows={4} style={{ width: "100%", padding: 8, marginBottom: 8 }} />
              <button type="submit" disabled={sending} style={{ width: "100%", padding: 8 }}>
                {sending ? "Sending…" : "Send"}
              </button>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}
