import React from "react";
import { useParams, Link } from "react-router-dom";
import { http } from "../lib/api.js";

const styles = {
  layout: { maxWidth: 900, margin: "24px auto" },
  meta: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 },
  kv: { display: "flex", gap: 8, alignItems: "baseline" },
  label: { fontWeight: 600, minWidth: 110 },
  box: { border: "1px solid #eee", borderRadius: 4, padding: 12, marginTop: 16 }
};

function Money({ v }) {
  return <span>{typeof v === "number" ? `$${v.toLocaleString()}` : "—"}</span>;
}

export default function VehicleDetails() {
  const { vin } = useParams();
  const [vehicle, setVehicle] = React.useState(null);
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  async function load() {
    setLoading(true);
    try {
      const v = await http.get(`/api/vehicles/${encodeURIComponent(vin)}`);
      setVehicle(v);

      // Try /api/events?vin=… first; if 404, try /api/vehicles/:vin/events
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

  if (loading) return <section style={styles.layout}>Loading…</section>;
  if (!vehicle) return <section style={styles.layout}>Not found.</section>;

  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? " " + vehicle.trim : ""}`;

  function contactDealer() {
    // Simple stub: open mailto; if you store dealerEmail, use it. Fallback to generic.
    const mail = vehicle.dealerEmail || "sales@example.com";
    const subject = encodeURIComponent(`Inquiry about ${vehicle.vin} (${title})`);
    const body = encodeURIComponent("Hi,\n\nI'm interested in this vehicle. Could you share more details and availability?\n\nThanks!");
    window.location.href = `mailto:${mail}?subject=${subject}&body=${body}`;
  }

  return (
    <section style={styles.layout}>
      <div>
        <Link to="/search">← Back to search</Link>
      </div>

      <h2 style={{ marginTop: 8 }}>{title}</h2>
      <div style={{ marginTop: 4, opacity: .8 }}>VIN: {vehicle.vin}</div>

      <div style={styles.box}>
        <div style={styles.meta}>
          <div style={styles.kv}><div style={styles.label}>Price</div><div><Money v={vehicle.price} /></div></div>
          <div style={styles.kv}><div style={styles.label}>Mileage</div><div>{vehicle.mileage?.toLocaleString() ?? "—"}</div></div>
          <div style={styles.kv}><div style={styles.label}>Location</div><div>{vehicle.location || "—"}</div></div>
          <div style={styles.kv}><div style={styles.label}>Status</div><div>{vehicle.inStock !== false ? "In stock" : "Sold"}</div></div>
        </div>
      </div>

      <div style={{ ...styles.box, marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Contact dealer</h3>
          <button onClick={contactDealer}>Email dealer</button>
        </div>
        <div style={{ marginTop: 8, opacity: .7 }}>
          This is a simple email link for the pilot. We’ll add an in-app lead form later.
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
