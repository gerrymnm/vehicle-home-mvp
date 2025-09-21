import React from "react";
import { useParams, Link } from "react-router-dom";
import { http } from "../lib/api.js";

const styles = {
  layout: { maxWidth: 900, margin: "24px auto" },
  meta: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 },
  kv: { display: "flex", gap: 8, alignItems: "baseline" },
  label: { fontWeight: 600, minWidth: 110 },
  box: { border: "1px solid #eee", borderRadius: 4, padding: 12, marginTop: 16 },
  badgeIn: { display: "inline-block", background: "#e8f6ee", color: "#0a6c3e", padding: "2px 8px", borderRadius: 12, fontSize: 12 },
  badgeOut: { display: "inline-block", background: "#f9eaea", color: "#9a1f1f", padding: "2px 8px", borderRadius: 12, fontSize: 12 },
  field: { display: "flex", flexDirection: "column", gap: 4 },
  input: { padding: 8 },
  textarea: { padding: 8, minHeight: 90 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }
};

function Money({ v }) {
  return <span>{typeof v === "number" ? `$${v.toLocaleString()}` : "—"}</span>;
}

export default function VehicleDetails() {
  const { vin } = useParams();
  const [vehicle, setVehicle] = React.useState(null);
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // lead form state
  const [lead, setLead] = React.useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [submitErr, setSubmitErr] = React.useState("");

  async function load() {
    setLoading(true);
    try {
      const v = await http.get(`/api/vehicles/${encodeURIComponent(vin)}`);
      setVehicle(v);

      // Try /api/events?vin=… first; fallback to /api/vehicles/:vin/events
      try {
        const ev = await http.get(`/api/events?vin=${encodeURIComponent(vin)}`);
        setEvents(Array.isArray(ev) ? ev : (ev.results || []));
      } catch {
        try {
          const ev2 = await http.get(`/api/vehicles/${encodeURIComponent(vin)}/events`);
          setEvents(Array.isArray(ev2) ? ev2 : (ev2.results || []));
        } catch {
          setEvents([]);
        }
      }
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, [vin]);

  function handleChange(e) {
    const { name, value } = e.target;
    setLead(prev => ({ ...prev, [name]: value }));
  }

  async function submitLead(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitErr("");
    try {
      // Try the backend endpoint first (we'll add it server-side next).
      await http.post("/api/leads", {
        vin,
        vehicleTitle: vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? " " + vehicle.trim : ""}` : undefined,
        dealerId: vehicle?.dealerId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        message: lead.message
      });
      setSubmitted(true);
    } catch (err) {
      // Fallback to mailto so pilot never blocks
      const to = vehicle?.dealerEmail || "sales@example.com";
      const subject = encodeURIComponent(`Inquiry about ${vin}`);
      const body = encodeURIComponent(
        `Hello,\n\nI'm interested in ${vehicle?.year ?? ""} ${vehicle?.make ?? ""} ${vehicle?.model ?? ""} (${vin}).\n\n` +
        `Name: ${lead.name}\nEmail: ${lead.email}\nPhone: ${lead.phone}\n\n` +
        `Message:\n${lead.message}\n`
      );
      try {
        window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
        setSubmitted(true);
      } catch {
        console.error(err);
        setSubmitErr("Could not submit the inquiry. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <section style={styles.layout}>Loading…</section>;
  if (!vehicle) return <section style={styles.layout}>Not found.</section>;

  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? " " + vehicle.trim : ""}`;
  const inStock = vehicle.inStock !== false;

  return (
    <section style={styles.layout}>
      <div><Link to="/search">← Back to search</Link></div>
      <h2 style={{ marginTop: 8 }}>{title}</h2>
      <div style={{ marginTop: 4, opacity: .8 }}>VIN: {vehicle.vin}</div>

      <div style={styles.box}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>Status:</div>
          {inStock ? <span style={styles.badgeIn}>In stock</span> : <span style={styles.badgeOut}>Sold</span>}
        </div>
        <div style={styles.meta}>
          <div style={styles.kv}><div style={styles.label}>Price</div><div><Money v={vehicle.price} /></div></div>
          <div style={styles.kv}><div style={styles.label}>Mileage</div><div>{vehicle.mileage?.toLocaleString() ?? "—"}</div></div>
          <div style={styles.kv}><div style={styles.label}>Location</div><div>{vehicle.location || "—"}</div></div>
          <div style={styles.kv}><div style={styles.label}>Dealer</div><div>{vehicle.dealerName || "—"}</div></div>
        </div>
      </div>

      <div style={{ ...styles.box, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Contact dealer</h3>
        {submitted ? (
          <div style={{ color: "#0a6c3e" }}>Thanks! Your inquiry has been sent.</div>
        ) : (
          <form onSubmit={submitLead} style={{ display: "grid", gap: 12 }}>
            <div style={styles.row}>
              <label style={styles.field}>
                <span>Your name</span>
                <input name="name" value={lead.name} onChange={handleChange} style={styles.input} required />
              </label>
              <label style={styles.field}>
                <span>Email</span>
                <input type="email" name="email" value={lead.email} onChange={handleChange} style={styles.input} required />
              </label>
            </div>
            <div style={styles.row}>
              <label style={styles.field}>
                <span>Phone</span>
                <input name="phone" value={lead.phone} onChange={handleChange} style={styles.input} />
              </label>
              <label style={styles.field}>
                <span>VIN</span>
                <input value={vin} readOnly style={styles.input} />
              </label>
            </div>
            <label style={styles.field}>
              <span>Message</span>
              <textarea name="message" value={lead.message} onChange={handleChange} style={styles.textarea}
                placeholder="I'd like to schedule a test drive or learn more about this vehicle." />
            </label>
            {submitErr && <div style={{ color: "#a00" }}>{submitErr}</div>}
            <div>
              <button disabled={submitting}>{submitting ? "Sending…" : "Send inquiry"}</button>
            </div>
          </form>
        )}
        <div style={{ marginTop: 8, opacity: .7, fontSize: 13 }}>
          For the pilot, if the server lead endpoint is unavailable, this will open your email client as a fallback.
        </div>
      </div>

      <div style={{ ...styles.box, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Recent activity</h3>
        {events.length === 0 ? (
          <div style={{ opacity: .7 }}>No recent events.</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {events.slice(0, 20).map((e, i) => (
              <li key={i}>
                <span style={{ fontWeight: 600 }}>{e.type || e.event || "event"}</span>
                {e.note ? ` — ${e.note}` : ""}
                {e.at || e.createdAt ? (
                  <span style={{ opacity: .7 }}> ({new Date(e.at || e.createdAt).toLocaleString()})</span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
