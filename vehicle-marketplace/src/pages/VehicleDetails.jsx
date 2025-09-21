import React from "react";
import { useParams, Link } from "react-router-dom";
import { fetchVehicleByVin, createLead } from "../lib/api.js";

const styles = {
  wrap: { maxWidth: 960, margin: "2rem auto", padding: "0 1rem" },
  h1: { fontSize: 22, marginBottom: 8 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 },
  card: { border: "1px solid #ddd", borderRadius: 8, padding: 16 },
  label: { display: "block", fontSize: 12, color: "#666", marginBottom: 4 },
  input: { width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6, marginBottom: 10 },
  btn: { padding: "8px 12px", border: "1px solid #999", borderRadius: 6, background: "#f7f7f7", cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse" },
  thtd: { borderBottom: "1px solid #eee", padding: "8px 6px", textAlign: "left" },
  note: { color: "#0a0", marginTop: 8 },
  err: { color: "#b00", marginTop: 8 }
};

export default function VehicleDetails() {
  const { vin } = useParams();
  const [vehicle, setVehicle] = React.useState(null);
  const [events, setEvents] = React.useState([]);
  const [lead, setLead] = React.useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = React.useState({ ok: "", err: "" });

  React.useEffect(() => {
    let isMounted = true;
    fetchVehicleByVin(vin).then((data) => {
      if (!isMounted) return;
      setVehicle(data?.vehicle || null);
      setEvents(data?.events || []);
    }).catch((e) => setStatus({ ok: "", err: e.message }));
    return () => { isMounted = false; };
  }, [vin]);

  async function submitLead(e) {
    e.preventDefault();
    setStatus({ ok: "", err: "" });
    try {
      await createLead({ vin, ...lead });
      setStatus({ ok: "Request sent. The dealer will contact you.", err: "" });
      setLead({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      setStatus({ ok: "", err: err.message });
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={{ marginBottom: 12 }}>
        <Link to="/">Vehicle Home</Link>
      </div>
      <h1 style={styles.h1}>Vehicle Details</h1>

      {!vehicle && <div>Loading…</div>}

      {vehicle && (
        <div style={styles.row}>
          <div style={styles.card}>
            <div><strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong></div>
            <div>VIN: {vehicle.vin}</div>
            <div>Trim: {vehicle.trim || "—"}</div>
            <div>Mileage: {vehicle.mileage?.toLocaleString?.() || vehicle.mileage || "—"}</div>
            <div>Price: {vehicle.price ? `$${Number(vehicle.price).toLocaleString()}` : "—"}</div>
            <div>Location: {vehicle.location || "—"}</div>
          </div>

          <form onSubmit={submitLead} style={styles.card}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Contact dealer</div>
            <label style={styles.label}>Name</label>
            <input style={styles.input} value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} required />
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} />
            <label style={styles.label}>Phone</label>
            <input style={styles.input} value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} />
            <label style={styles.label}>Message</label>
            <textarea style={{ ...styles.input, minHeight: 80 }} value={lead.message} onChange={(e) => setLead({ ...lead, message: e.target.value })} />
            <button style={styles.btn} type="submit">Send</button>
            {status.ok && <div style={styles.note}>{status.ok}</div>}
            {status.err && <div style={styles.err}>{status.err}</div>}
          </form>
        </div>
      )}

      <div style={{ ...styles.card, marginTop: 24 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>History</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.thtd}>Date</th>
              <th style={styles.thtd}>Event</th>
              <th style={styles.thtd}>Note</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev, i) => (
              <tr key={i}>
                <td style={styles.thtd}>{new Date(ev.ts || ev.created_at || Date.now()).toLocaleString()}</td>
                <td style={styles.thtd}>{ev.type || ev.event || "event"}</td>
                <td style={styles.thtd}>{ev.note || ev.details || "—"}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr><td style={styles.thtd} colSpan={3}>No events</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
