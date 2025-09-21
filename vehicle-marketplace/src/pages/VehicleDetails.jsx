// vehicle-marketplace/src/pages/VehicleDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import { fetchVehicleByVin, createLead } from "../lib/api";

function useVinFromRoute() {
  const { vin: vinParam } = useParams();
  const loc = useLocation();
  const qsVin = new URLSearchParams(loc.search).get("vin");
  return vinParam || qsVin || "";
}

export default function VehicleDetails() {
  const vin = useVinFromRoute();
  const [vehicle, setVehicle] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const [submitState, setSubmitState] = useState({ ok: false, err: "" });

  useEffect(() => {
    let alive = true;
    async function run() {
      setLoading(true);
      setLoadErr("");
      try {
        if (!vin) {
          setLoadErr("Missing VIN in URL.");
          return;
        }
        const data = await fetchVehicleByVin(vin);
        // Be tolerant to shape: either {vehicle, events} or a plain object.
        const v = data?.vehicle ?? data ?? null;
        const ev = data?.events ?? [];
        if (alive) {
          setVehicle(v);
          setEvents(Array.isArray(ev) ? ev : []);
        }
      } catch (e) {
        if (alive) setLoadErr(String(e?.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [vin]);

  const title = useMemo(() => {
    if (!vehicle) return `Vehicle ${vin}`;
    const parts = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
      .filter(Boolean)
      .join(" ");
    return parts || `Vehicle ${vin}`;
  }, [vehicle, vin]);

  async function onSubmit(e) {
    e.preventDefault();
    setSubmitState({ ok: false, err: "" });

    if (!name.trim()) {
      setSubmitState({ ok: false, err: "Please enter your name." });
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setSubmitState({
        ok: false,
        err: "Provide at least an email or a phone number.",
      });
      return;
    }

    try {
      await createLead({
        vin,
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        message: message.trim() || undefined,
      });
      setSubmitState({ ok: true, err: "" });
      setMessage("");
    } catch (err) {
      setSubmitState({ ok: false, err: String(err?.message || err) });
    }
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "2rem 1rem" }}>
      <nav style={{ marginBottom: "1rem" }}>
        <Link to="/">Vehicle Home</Link>
        {" · "}
        <Link to="/search">Search</Link>
      </nav>

      <h1 style={{ margin: 0 }}>{title}</h1>
      <div style={{ color: "#666", marginBottom: "1.25rem" }}>VIN: {vin}</div>

      {loading && <div>Loading vehicle…</div>}
      {loadErr && (
        <div style={{ color: "crimson", marginBottom: "1rem" }}>{loadErr}</div>
      )}

      {/* Simple vehicle summary if present */}
      {vehicle && (
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: 8,
            padding: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <strong>Price:</strong>{" "}
            {vehicle.price ? `$${Number(vehicle.price).toLocaleString()}` : "—"}
          </div>
          <div>
            <strong>Mileage:</strong>{" "}
            {vehicle.mileage ? Number(vehicle.mileage).toLocaleString() : "—"}
          </div>
          <div>
            <strong>Location:</strong> {vehicle.location || "—"}
          </div>
          {vehicle.status && (
            <div>
              <strong>Status:</strong> {vehicle.status}
            </div>
          )}
        </div>
      )}

      {/* Contact Seller */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Contact seller</h2>
        <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.75rem" }}>
          <div>
            <label style={{ display: "block", fontSize: 14, color: "#444" }}>
              Your name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Buyer"
              required
              style={{ width: "100%", padding: "8px" }}
            />
          </div>
          <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <label style={{ display: "block", fontSize: 14, color: "#444" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                style={{ width: "100%", padding: "8px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 14, color: "#444" }}>
                Phone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="555-123-4567"
                style={{ width: "100%", padding: "8px" }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 14, color: "#444" }}>
              Message
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="I'm interested in this vehicle. Is it still available?"
              style={{ width: "100%", padding: "8px" }}
            />
          </div>

          {submitState.err && (
            <div style={{ color: "crimson" }}>{submitState.err}</div>
          )}
          {submitState.ok && (
            <div style={{ color: "green" }}>
              Thanks! Your inquiry was sent to the dealer.
            </div>
          )}

          <div>
            <button type="submit">Send inquiry</button>
          </div>
        </form>
      </section>

      {/* Recent events, if any */}
      {events?.length > 0 && (
        <section
          style={{
            border: "1px solid #eee",
            borderRadius: 8,
            padding: "1rem",
          }}
        >
          <h3 style={{ marginTop: 0 }}>History</h3>
          <ul>
            {events.slice(0, 20).map((e, i) => (
              <li key={i}>
                <span style={{ color: "#666" }}>
                  {e?.ts ? new Date(e.ts).toLocaleString() : "—"}
                </span>
                {" · "}
                <span>{e?.type || e?.event || "event"}</span>
                {e?.note ? ` — ${e.note}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
