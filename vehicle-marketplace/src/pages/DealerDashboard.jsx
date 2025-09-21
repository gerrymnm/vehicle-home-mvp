import React from "react";
import { api } from "../lib/api.js";

const cell = { padding: "8px 6px", borderBottom: "1px solid #eee" };
const th = { ...cell, fontWeight: 600 };

export default function DealerDashboard() {
  const [form, setForm] = React.useState({ vin: "", year: "", make: "", model: "", trim: "", price: "", mileage: "", location: "" });
  const [saving, setSaving] = React.useState(false);
  const [notice, setNotice] = React.useState("");
  const [inv, setInv] = React.useState([]);
  const [leads, setLeads] = React.useState([]);
  const [csvFile, setCsvFile] = React.useState(null);

  async function loadAll() {
    const [inventory, leadList] = await Promise.all([api.myInventory(), api.listLeads().catch(() => [])]);
    setInv(inventory || []);
    setLeads(leadList || []);
  }

  React.useEffect(() => { loadAll(); }, []);

  async function saveVehicle(e) {
    e.preventDefault();
    setSaving(true);
    setNotice("");
    await api.upsertVehicle({
      vin: form.vin.trim(),
      year: Number(form.year) || null,
      make: form.make.trim(),
      model: form.model.trim(),
      trim: form.trim.trim(),
      price: Number(form.price) || null,
      mileage: Number(form.mileage) || null,
      location: form.location.trim()
    });
    setForm({ vin: "", year: "", make: "", model: "", trim: "", price: "", mileage: "", location: "" });
    await loadAll();
    setSaving(false);
    setNotice("Vehicle saved.");
  }

  function editRow(v) {
    setForm({
      vin: v.vin || "",
      year: v.year || "",
      make: v.make || "",
      model: v.model || "",
      trim: v.trim || "",
      price: v.price || "",
      mileage: v.mileage || "",
      location: v.location || ""
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleSold(v) {
    if (v.sold) await api.unmarkSold(v.vin);
    else await api.markSold(v.vin, "");
    await loadAll();
  }

  async function remove(v) {
    await api.deleteVehicle(v.vin);
    await loadAll();
  }

  async function uploadCsv() {
    if (!csvFile) return;
    const text = await csvFile.text();
    const rows = text.split(/\r?\n/).filter(Boolean);
    const headers = rows.shift().split(",").map((s) => s.trim().toLowerCase());
    const idx = (k) => headers.indexOf(k);
    for (const row of rows) {
      const cols = row.split(",").map((s) => s.trim());
      const payload = {
        vin: cols[idx("vin")] || "",
        year: Number(cols[idx("year")] || "") || null,
        make: cols[idx("make")] || "",
        model: cols[idx("model")] || "",
        trim: cols[idx("trim")] || "",
        price: Number(cols[idx("price")] || "") || null,
        mileage: Number(cols[idx("mileage")] || "") || null,
        location: cols[idx("location")] || ""
      };
      if (payload.vin) await api.upsertVehicle(payload);
    }
    setCsvFile(null);
    await loadAll();
  }

  async function setLead(id, status) {
    await api.setLeadStatus(id, status);
    await loadAll();
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Dealer Dashboard</h2>

      <form onSubmit={saveVehicle} style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 16 }}>
        <input placeholder="VIN" value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} />
        <input placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} />
        <input placeholder="Make" value={form.make} onChange={(e) => setForm({ ...form, make: e.target.value })} />
        <input placeholder="Model" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} />
        <input placeholder="Trim" value={form.trim} onChange={(e) => setForm({ ...form, trim: e.target.value })} />
        <input placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <input placeholder="Mileage" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} />
        <input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <div style={{ gridColumn: "1 / span 6" }}>
          <button type="submit" disabled={saving}>Save Vehicle</button>
          {notice && <span style={{ marginLeft: 12, color: "green" }}>{notice}</span>}
        </div>
      </form>

      <div style={{ margin: "24px 0" }}>
        <h3>Bulk Import (CSV)</h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
          <button onClick={uploadCsv} disabled={!csvFile}>Upload</button>
          <button onClick={() => setCsvFile(null)}>Clear</button>
        </div>
        <div style={{ color: "#666", marginTop: 6 }}>Headers: vin,year,make,model,trim,price,mileage,location</div>
      </div>

      <h3>My Inventory</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={th}>Vehicle</th>
              <th style={th}>VIN</th>
              <th style={th}>Price</th>
              <th style={th}>Mileage</th>
              <th style={th}>Location</th>
              <th style={th}>Status</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inv.map((v) => (
              <tr key={v.vin}>
                <td style={cell}>{v.year} {v.make} {v.model} {v.trim}</td>
                <td style={cell}>{v.vin}</td>
                <td style={cell}>${v.price?.toLocaleString?.() || v.price}</td>
                <td style={cell}>{v.mileage?.toLocaleString?.() || v.mileage}</td>
                <td style={cell}>{v.location || "—"}</td>
                <td style={cell}>{v.sold ? "Sold" : "In stock"}</td>
                <td style={cell}>
                  <button onClick={() => editRow(v)} style={{ marginRight: 6 }}>Edit</button>
                  <button onClick={() => toggleSold(v)} style={{ marginRight: 6 }}>{v.sold ? "Unmark sold" : "Mark sold"}</button>
                  <button onClick={() => remove(v)}>Delete</button>
                </td>
              </tr>
            ))}
            {inv.length === 0 ? <tr><td style={cell} colSpan={7}>No vehicles yet.</td></tr> : null}
          </tbody>
        </table>
      </div>

      <h3 style={{ marginTop: 32 }}>Leads</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={th}>When</th>
              <th style={th}>VIN</th>
              <th style={th}>Name</th>
              <th style={th}>Email</th>
              <th style={th}>Phone</th>
              <th style={th}>Message</th>
              <th style={th}>Status</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td style={cell}>{new Date(l.created_at || l.createdAt || Date.now()).toLocaleString()}</td>
                <td style={cell}>{l.vin}</td>
                <td style={cell}>{l.name}</td>
                <td style={cell}>{l.email}</td>
                <td style={cell}>{l.phone || "—"}</td>
                <td style={cell}>{l.message || "—"}</td>
                <td style={cell}>{l.status}</td>
                <td style={cell}>
                  <button onClick={() => setLead(l.id, "contacted")} style={{ marginRight: 6 }}>Contacted</button>
                  <button onClick={() => setLead(l.id, "closed")} style={{ marginRight: 6 }}>Closed</button>
                  <button onClick={() => setLead(l.id, "archived")}>Archive</button>
                </td>
              </tr>
            ))}
            {leads.length === 0 ? <tr><td style={cell} colSpan={8}>No leads yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
