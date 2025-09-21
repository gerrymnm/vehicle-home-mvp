import React from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api.js";

export default function VehicleDetails() {
  const { vin } = useParams();
  const [vehicle, setVehicle] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [lead, setLead] = React.useState({ name: "", email: "", phone: "", message: "" });
  const [sent, setSent] = React.useState("");

  React.useEffect(() => {
    let on = true;
    setLoading(true);
    api.vehicleByVin(vin)
      .then((v) => { if (on) setVehicle(v); })
      .catch(() => { if (on) setVehicle(null); })
      .finally(() => { if (on) setLoading(false); });
    return () => { on = false; };
  }, [vin]);

  async function submitLead(e) {
    e.preventDefault();
    setSent("");
    await api.createLead({ vin, ...lead });
    setLead({ name: "", email: "", phone: "", message: "" });
    setSent("Thanks! The dealer will contact you soon.");
  }

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!vehicle) return <div style={{ padding: 24 }}>Not found</div>;

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 8 }}>{vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim || ""}</h2>
      <div style={{ marginBottom: 16, color: "#555" }}>
        VIN {vehicle.vin} • {vehicle.mileage?.toLocaleString?.() || vehicle.mileage} miles • ${vehicle.price?.toLocaleString?.() || vehicle.price}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <div style={{ border: "1px solid #eee", padding: 16, borderRadius: 8 }}>
            <h3 style={{ marginTop: 0 }}>Details</h3>
            <ul style={{ paddingLeft: 18, lineHeight: 1.8 }}>
              <li>Location: {vehicle.location || "—"}</li>
              <li>Status: {vehicle.sold ? "Sold" : "In stock"}</li>
            </ul>
          </div>
        </div>

        <div>
          <form onSubmit={submitLead} style={{ border: "1px solid #eee", padding: 16, borderRadius: 8 }}>
            <h3 style={{ marginTop: 0 }}>Contact dealer</h3>
            <div style={{ display: "grid", gap: 8 }}>
              <input placeholder="Name" value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} />
              <input placeholder="Email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} />
              <input placeholder="Phone" value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} />
              <textarea placeholder="Message" rows={4} value={lead.message} onChange={(e) => setLead({ ...lead, message: e.target.value })} />
              <button type="submit">Send</button>
              {sent ? <div style={{ color: "green" }}>{sent}</div> : null}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
