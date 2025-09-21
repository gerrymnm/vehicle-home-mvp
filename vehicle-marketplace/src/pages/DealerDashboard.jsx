import React from "react";
import { api, fetchDealerLeads, updateLead } from "../lib/api.js";

const styles = {
  wrap: { maxWidth: 1000, margin: "2rem auto", padding: "0 1rem" },
  h1: { fontSize: 22, marginBottom: 8 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 },
  input: { width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 6 },
  btn: { padding: "8px 12px", border: "1px solid #999", borderRadius: 6, background: "#f7f7f7", cursor: "pointer" },
  card: { border: "1px solid #ddd", borderRadius: 8, padding: 16, marginTop: 16 },
  table: { width: "100%", borderCollapse: "collapse" },
  thtd: { borderBottom: "1px solid #eee", padding: "8px 6px", textAlign: "left" },
  small: { fontSize: 12, color: "#666" }
};

export default function DealerDashboard() {
  const [me, setMe] = React.useState(null);
  const [vehicles, setVehicles] = React.useState([]);
  const [form, setForm] = React.useState({ vin: "", year: "", make: "", model: "", trim: "", price: "", mileage: "", location: "" });
  const [csv, setCsv] = React.useState(null);
  const [leads, setLeads] = React.useState([]);
  const [note, setNote] = React.useState({});

  React.useEffect(() => {
    load();
    loadLeads();
  }, []);

  async function load() {
    const meRes = await fetch(`${api.base}/me`, { headers: authH() }).then(r => r.json()).catch(() => null);
    setMe(meRes);
    const inv = await fetch(`${api.base}/dealer/inventory`, { headers: authH() }).then(r => r.json()).catch(() => []);
    setVehicles(inv || []);
  }

  async function loadLeads() {
    try {
      const data = await fetchDealerLeads();
      setLeads(Array.isArray(data) ? data : []);
    } catch {
      setLeads([]);
    }
  }

  function authH() {
    const at = typeof localStorage !== "undefined" ? localStorage.getItem("vh_at") : null;
    return at ? { Authorization: `Bearer ${at}` } : {};
  }

  async function saveVehicle() {
    const body = { ...form, year: form.year ? Number(form.year) : null, price: form.price ? Number(form.price) : null, mileage: form.mileage ? Number(form.mileage) : null };
    await fetch(`${api.base}/dealer/vehicle`, { method: "POST", headers: { "Content-Type": "application/json", ...authH() }, body: JSON.stringify(body) });
    setForm({ vin: "", year: "", make: "", model: "", trim: "", price: "", mileage: "", location: "" });
    await load();
  }

  async function toggleSold(vin, sold) {
    await fetch(`${api.base}/vehicles/${encodeURIComponent(vin)}/${sold ? "unsold" : "sold"}`, { method: "POST", headers: authH() });
    await load();
  }

  async function delVehicle(vin) {
    await fetch(`${api.base}/vehicles/${encodeURIComponent(vin)}`, { method: "DELETE", headers: authH() });
    await load();
  }

  async function uploadCsv() {
    if (!csv) return;
    const fd = new FormData();
    fd.append("file", csv);
    await fetch(`${api.base}/dealer/import`, { method: "POST", headers: authH(), body: fd });
    setCsv(null);
    await load();
  }

  async function changeLeadStatus(id, status) {
    await updateLead(id, { status });
    await loadLeads();
  }

  async function saveLeadNote(id) {
    const n = note[id] || "";
    await updateLead(id, { note: n });
    await loadLeads();
  }

  return (
    <div style={styles.wrap}>
      <h1 style={styles.h1}>Dealer Dashboard</h1>
      <div style={styles.small}>Signed in as {me?.email || "—"}</div>

      <div style={styles.card}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Add / Update Vehicle</div>
        <div className="grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.6fr 1fr 1fr 1fr 0.8fr 0.8fr 1fr auto", gap: 8 }}>
          <input style={styles.input} placeholder="VIN" value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} />
          <input style={styles.input} placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
          <input style={styles.input} placeholder="Make" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
          <input style={styles.input} placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
          <input style={styles.input} placeholder="Trim" value={form.trim} onChange={(e) => setForm({ ...form, trim: e.target.value })} />
          <input style={styles.input} placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <input style={styles.input} placeholder="Mileage" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} />
          <input style={styles.input} placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <button style={styles.btn} onClick={saveVehicle}>Save Vehicle</button>
        </div>
      </div>

      <div style={styles.card}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Bulk Import (CSV)</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="file" accept=".csv" onChange={(e) => setCsv(e.target.files?.[0] || null)} />
          <button style={styles.btn} onClick={uploadCsv}>Upload</button>
          <button style={styles.btn} onClick={() => setCsv(null)}>Clear</button>
          <a style={styles.btn} href="data:text/csv;charset=utf-8,vin,year,make,model,trim,price,mileage,location%0A" download="template.csv">Download template (.csv)</a>
        </div>
      </div>

      <div style={styles.card}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>My Inventory</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.thtd}>Vehicle</th>
              <th style={styles.thtd}>VIN</th>
              <th style={styles.thtd}>Price</th>
              <th style={styles.thtd}>Mileage</th>
              <th style={styles.thtd}>Status</th>
              <th style={styles.thtd}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.vin}>
                <td style={styles.thtd}>{v.year} {v.make} {v.model} {v.trim || ""}</td>
                <td style={styles.thtd}>{v.vin}</td>
                <td style={styles.thtd}>{v.price ? `$${Number(v.price).toLocaleString()}` : "—"}</td>
                <td style={styles.thtd}>{v.mileage?.toLocaleString?.() || v.mileage || "—"}</td>
                <td style={styles.thtd}>{v.sold ? "Sold" : "In stock"}</td>
                <td style={styles.thtd}>
                  <button style={styles.btn} onClick={() => toggleSold(v.vin, v.sold)}>{v.sold ? "Unmark sold" : "Mark sold"}</button>{" "}
                  <button style={styles.btn} onClick={() => delVehicle(v.vin)}>Delete</button>
                </td>
              </tr>
            ))}
            {vehicles.length === 0 && <tr><td style={styles.thtd} colSpan={6}>No inventory</td></tr>}
          </tbody>
        </table>
      </div>

      <div style={styles.card}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Leads</div>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.thtd}>When</th>
              <th style={styles.thtd}>VIN</th>
              <th style={styles.thtd}>Name</th>
              <th style={styles.thtd}>Contact</th>
              <th style={styles.thtd}>Message</th>
              <th style={styles.thtd}>Status</th>
              <th style={styles.thtd}>Note</th>
              <th style={styles.thtd}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td style={styles.thtd}>{new Date(l.created_at || Date.now()).toLocaleString()}</td>
                <td style={styles.thtd}>{l.vin}</td>
                <td style={styles.thtd}>{l.name}</td>
                <td style={styles.thtd}>{[l.email, l.phone].filter(Boolean).join(" / ") || "—"}</td>
                <td style={styles.thtd}>{l.message || "—"}</td>
                <td style={styles.thtd}>
                  <select value={l.status} onChange={(e) => changeLeadStatus(l.id, e.target.value)} style={styles.input}>
                    <option value="new">new</option>
                    <option value="contacted">contacted</option>
                    <option value="won">won</option>
                    <option value="lost">lost</option>
                  </select>
                </td>
                <td style={styles.thtd}>
                  <input style={styles.input} value={note[l.id] ?? l.note ?? ""} onChange={(e) => setNote({ ...note, [l.id]: e.target.value })} />
                </td>
                <td style={styles.thtd}>
                  <button style={styles.btn} onClick={() => saveLeadNote(l.id)}>Save</button>
                </td>
              </tr>
            ))}
            {leads.length === 0 && <tr><td style={styles.thtd} colSpan={8}>No leads</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
