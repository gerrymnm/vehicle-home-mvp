import React from "react";
import { useParams, Link } from "react-router-dom";
import { http } from "../lib/api.js";

export default function VehicleHome() {
  const { vin } = useParams();
  const [vehicle, setVehicle] = React.useState(null);
  const [events, setEvents] = React.useState([]);
  const [metrics, setMetrics] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [form, setForm] = React.useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const role = React.useMemo(() => localStorage.getItem("role") || "guest", []);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    Promise.all([
      http.get(`/api/search?q=${encodeURIComponent(vin)}`),
      http.get(`/api/events?vin=${encodeURIComponent(vin)}`).catch(() => ({ results: [] })),
      http.get(`/api/metrics?vin=${encodeURIComponent(vin)}`).catch(() => ({})),
    ])
      .then(([sr, er, mr]) => {
        if (!alive) return;
        const v = (sr.results || []).find((r) => r.vin === vin) || (sr.results || [])[0] || null;
        setVehicle(v);
        setEvents(er.results || []);
        setMetrics(mr || null);
        setLoading(false);
        if (v) document.title = `${v.year || ""} ${v.make || ""} ${v.model || ""} ${v.trim || ""} • ${v.vin}`;
      })
      .catch((e) => {
        if (!alive) return;
        setError(String(e));
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [vin]);

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function submitLead(e) {
    e.preventDefault();
    setSending(true);
    setSent(false);
    setError(null);
    try {
      await http.post("/api/leads", {
        vin,
        name: form.name,
        email: form.email,
        phone: form.phone,
        message: form.message || "Interested in this vehicle",
      });
      setSent(true);
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      setError(String(err));
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div style={{ maxWidth: 1000, margin: "24px auto" }}>Loading…</div>;
  if (error) return <div style={{ maxWidth: 1000, margin: "24px auto", color: "red" }}>Error: {error}</div>;
  if (!vehicle) return <div style={{ maxWidth: 1000, margin: "24px auto" }}>Not found</div>;

  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${vehicle.year || ""} ${vehicle.make || ""} ${vehicle.model || ""} ${vehicle.trim || ""}`.trim(),
    sku: vin,
    vehicleIdentificationNumber: vin,
    brand: vehicle.make || "",
    model: vehicle.model || "",
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: vehicle.price || "",
      availability: (vehicle.status || "In stock").toLowerCase().includes("sold") ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
    },
  };

  return (
    <section style={{ maxWidth: 1000, margin: "24px auto", padding: "0 12px" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <p style={{ marginBottom: 12 }}>
        <Link to="/search?q=">← Back to search</Link>
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        <div>
          <h1 style={{ margin: "0 0 8px" }}>
            {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim || ""}
          </h1>
          <div style={{ color: "#444", marginBottom: 16 }}>
            <div>VIN: {vehicle.vin}</div>
            <div>{vehicle.price ? `$${Number(vehicle.price).toLocaleString()}` : ""}</div>
            <div>
              {vehicle.mileage ? `${Number(vehicle.mileage).toLocaleString()} miles` : ""} {vehicle.location ? `• ${vehicle.location}` : ""}
            </div>
            <div>Status: {vehicle.status || "In stock"}</div>
          </div>

          <div style={{ marginTop: 16 }}>
            <h3 style={{ margin: "16px 0 8px" }}>History</h3>
            {events.length === 0 && <div>No history yet.</div>}
            <ul style={{ listStyle: "none", padding: 0 }}>
              {events.map((ev, i) => (
                <li key={i} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
                  <div style={{ fontWeight: 600 }}>{ev.type || ev.event || "event"}</div>
                  <div style={{ fontSize: 12, color: "#666" }}>{ev.created_at || ev.createdAt || ""}</div>
                  {ev.message && <div>{ev.message}</div>}
                </li>
              ))}
            </ul>
          </div>

          {metrics && metrics.priceHistory && Array.isArray(metrics.priceHistory) && metrics.priceHistory.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ margin: "16px 0 8px" }}>Price history</h3>
              <ul style={{ listStyle: "none", padding: 0 }}>
                {metrics.priceHistory.map((p, i) => (
                  <li key={i} style={{ padding: "6px 0", borderBottom: "1px dashed #eee" }}>
                    {p.date}: ${Number(p.price).toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          {role === "dealer" || role === "admin" ? (
            <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6, marginBottom: 16 }}>
              <h3 style={{ marginTop: 0 }}>Dealer tools</h3>
              <div style={{ fontSize: 14, color: "#555", marginBottom: 8 }}>Manage this vehicle from the dealer dashboard.</div>
              <Link to="/dealer">Open dealer dashboard</Link>
            </div>
          ) : null}

          <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6 }}>
            <h3 style={{ marginTop: 0 }}>Contact dealer</h3>
            {sent && <div style={{ color: "green", marginBottom: 8 }}>Sent. We’ll be in touch.</div>}
            {error && <div style={{ color: "red", marginBottom: 8 }}>Error: {error}</div>}
            <form onSubmit={submitLead} style={{ display: "grid", gap: 8 }}>
              <input name="name" value={form.name} onChange={onChange} placeholder="Your name" required style={{ padding: 8 }} />
              <input name="email" value={form.email} onChange={onChange} placeholder="Email" type="email" required style={{ padding: 8 }} />
              <input name="phone" value={form.phone} onChange={onChange} placeholder="Phone" style={{ padding: 8 }} />
              <textarea name="message" value={form.message} onChange={onChange} placeholder="Message" rows={4} style={{ padding: 8 }} />
              <button type="submit" disabled={sending}>{sending ? "Sending…" : "Send"}</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
