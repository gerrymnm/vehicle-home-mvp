import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { http } from "../lib/api.js";

export default function VehicleHome() {
  const { vin } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [lead, setLead] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let off = false;
    async function load() {
      setLoading(true);
      setErr("");
      try {
        const res = await http(`/api/search?q=${encodeURIComponent(vin)}`);
        const list = Array.isArray(res.results) ? res.results : [];
        const match = list.find(r => r.vin === vin) || list[0] || null;
        if (!off) setVehicle(match);
      } catch (e) {
        if (!off) setErr(e?.message || "Failed to load vehicle");
      } finally {
        if (!off) setLoading(false);
      }
      try {
        const ev = await http(`/api/events?vin=${encodeURIComponent(vin)}`);
        if (!off) setHistory(ev.events || []);
      } catch {}
    }
    load();
    return () => { off = true; };
  }, [vin]);

  async function submitLead(e) {
    e.preventDefault();
    setSending(true);
    setErr("");
    setSent(false);
    try {
      await http(`/api/leads`, {
        method: "POST",
        body: JSON.stringify({
          vin,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          message: lead.message || ""
        })
      });
      setSent(true);
      setLead({ name: "", email: "", phone: "", message: "" });
    } catch (e) {
      setErr(e?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: 24 }}>
      <Link to="/search">← Back to search</Link>
      {loading && <p>Loading...</p>}
      {err && <p style={{ color: "red" }}>Error: {err}</p>}
      {vehicle && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>
          <div>
            <h1 style={{ margin: "12px 0" }}>
              {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
            </h1>
            <p>VIN: {vehicle.vin}</p>
            <p>{vehicle.mileage?.toLocaleString?.() || vehicle.mileage} miles • {vehicle.location || ""}</p>
            <p>{vehicle.price ? `$${Number(vehicle.price).toLocaleString()}` : ""}</p>
            <p>Status: {vehicle.sold ? "Sold" : "In stock"}</p>

            <h3 style={{ marginTop: 24 }}>History</h3>
            {history.length === 0 && <p>No history yet.</p>}
            {history.length > 0 && (
              <ul>
                {history.map((ev, i) => (
                  <li key={i}>{ev.when ? new Date(ev.when).toLocaleString() : ""} — {ev.type || ev.event || ""}</li>
                ))}
              </ul>
            )}
          </div>

          <div style={{ border: "1px solid #ddd", borderRadius: 4, padding: 12 }}>
            <h3>Contact dealer</h3>
            {sent && <div style={{ color: "green", marginBottom: 8 }}>Sent.</div>}
            <form onSubmit={submitLead}>
              <input value={lead.name} onChange={e=>setLead({ ...lead, name: e.target.value })} placeholder="Your name" style={{ width: "100%", marginBottom: 8, padding: 8 }} required />
              <input value={lead.email} onChange={e=>setLead({ ...lead, email: e.target.value })} placeholder="Email" type="email" style={{ width: "100%", marginBottom: 8, padding: 8 }} />
              <input value={lead.phone} onChange={e=>setLead({ ...lead, phone: e.target.value })} placeholder="Phone" style={{ width: "100%", marginBottom: 8, padding: 8 }} />
              <textarea value={lead.message} onChange={e=>setLead({ ...lead, message: e.target.value })} placeholder="Message" rows={4} style={{ width: "100%", marginBottom: 8, padding: 8 }} />
              <button disabled={sending} style={{ width: "100%", padding: 8 }}>{sending ? "Sending..." : "Send"}</button>
            </form>
          </div>
        </div>
      )}
      {!loading && !vehicle && !err && <p>No match found.</p>}
    </div>
  );
}
