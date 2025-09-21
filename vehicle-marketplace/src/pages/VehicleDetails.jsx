import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { http } from "../lib/api.js";

export default function VehicleDetails() {
  const { vin } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr("");
    http
      .get(`/vehicles/${encodeURIComponent(vin)}`)
      .then((res) => {
        if (mounted) setVehicle(res.data);
      })
      .catch(() => setErr("Could not load vehicle."))
      .finally(() => setLoading(false));
    return () => {
      mounted = false;
    };
  }, [vin]);

  function submitLead(e) {
    e.preventDefault();
    setErr("");
    setSent(false);
    http
      .post("/leads", {
        vin,
        name,
        email,
        phone,
        message,
      })
      .then(() => {
        setSent(true);
        setName("");
        setEmail("");
        setPhone("");
        setMessage("");
      })
      .catch(() => setErr("Failed to submit. Please try again."));
  }

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (err) return <div style={{ padding: 24 }}>{err}</div>;
  if (!vehicle) return <div style={{ padding: 24 }}>Not found</div>;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 12 }}>
        <Link to="/search">← Back to Search</Link>
      </div>

      <h2 style={{ margin: "8px 0" }}>
        {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim || ""}
      </h2>
      <div style={{ marginBottom: 16, color: "#555" }}>VIN: {vin}</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24 }}>
        <div>
          <table>
            <tbody>
              <tr>
                <td style={{ padding: "4px 8px" }}>Price</td>
                <td style={{ padding: "4px 8px", fontWeight: 600 }}>
                  {vehicle.price ? `$${Number(vehicle.price).toLocaleString()}` : "—"}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "4px 8px" }}>Mileage</td>
                <td style={{ padding: "4px 8px" }}>
                  {vehicle.mileage ? Number(vehicle.mileage).toLocaleString() : "—"}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "4px 8px" }}>Location</td>
                <td style={{ padding: "4px 8px" }}>{vehicle.location || "—"}</td>
              </tr>
              <tr>
                <td style={{ padding: "4px 8px" }}>Status</td>
                <td style={{ padding: "4px 8px" }}>{vehicle.sold ? "Sold" : "In stock"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <form onSubmit={submitLead} style={{ border: "1px solid #ddd", padding: 16, borderRadius: 6 }}>
          <h3 style={{ marginTop: 0 }}>Request info</h3>

          {sent && (
            <div style={{ background: "#e6ffed", padding: 8, marginBottom: 12, borderRadius: 4 }}>
              Thanks! The dealer has received your request.
            </div>
          )}
          {err && (
            <div style={{ background: "#ffe6e6", padding: 8, marginBottom: 12, borderRadius: 4 }}>
              {err}
            </div>
          )}

          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", marginBottom: 4 }}>Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", marginBottom: 4 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: "block", marginBottom: 4 }}>Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ width: "100%" }}
              placeholder="Optional"
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", marginBottom: 4 }}>Message</label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: "100%" }}
              placeholder="Is it available? Can I schedule a test drive?"
            />
          </div>

          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}
