import React from "react";
import Papa from "papaparse";
import { http } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

function Money({ v }) {
  return <span>{typeof v === "number" ? `$${v.toLocaleString()}` : "—"}</span>;
}

export default function Dealerdashboard() {
  const { user } = useAuth();

  const [list, setList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [msg, setMsg] = React.useState("");

  // single add/update form
  const [form, setForm] = React.useState({
    vin: "", year: "", make: "", model: "", trim: "", price: "", mileage: "", location: ""
  });

  // inline edit state
  const [editing, setEditing] = React.useState(null); // vin currently editing
  const [editRow, setEditRow] = React.useState({ price: "", mileage: "", location: "" });

  // CSV import preview
  const [csvPreview, setCsvPreview] = React.useState([]);

  async function load() {
    setLoading(true);
    try {
      const data = await http.get("/api/vehicles?includeOutOfStock=true&pageSize=200");
      const mine = (data.results || []).filter(v => v.dealerId === user.dealerId);
      setList(mine);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }
  React.useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function createVehicle(e) {
    e.preventDefault();
    setMsg("");
    const payload = {
      vin: form.vin.trim(),
      year: form.year ? Number(form.year) : undefined,
      make: form.make.trim(),
      model: form.model.trim(),
      trim: form.trim.trim() || undefined,
      price: form.price ? Number(form.price) : undefined,
      mileage: form.mileage ? Number(form.mileage) : undefined,
      location: form.location || undefined
    };
    try {
      await http.post("/api/vehicles", payload);
      setForm({ vin:"", year:"", make:"", model:"", trim:"", price:"", mileage:"", location:"" });
      setMsg("Vehicle saved.");
      await load();
    } catch (e2) {
      console.error(e2);
      setMsg("Failed to save vehicle.");
    }
  }

  function beginEdit(v) {
    setEditing(v.vin);
    setEditRow({
      price: v.price ?? "",
      mileage: v.mileage ?? "",
      location: v.location ?? ""
    });
  }
  function cancelEdit() {
    setEditing(null);
    setEditRow({ price:"", mileage:"", location:"" });
  }
  async function saveEdit(vin) {
    try {
      const patch = {};
      if (editRow.price !== "") patch.price = Number(editRow.price);
      if (editRow.mileage !== "") patch.mileage = Number(editRow.mileage);
      if (String(editRow.location).trim() !== "") patch.location = String(editRow.location).trim();
      await http.patch(`/api/vehicles/${encodeURIComponent(vin)}`, patch);
      setEditing(null);
      await load();
    } catch {
      alert("Failed to save changes");
    }
  }

  async function markSold(vin) {
    try {
      await http.post(`/api/vehicles/${encodeURIComponent(vin)}/sold`, { note: "Sold from dashboard" });
      await load();
    } catch {
      alert("Failed to mark sold");
    }
  }

  /* ---------------- CSV import ---------------- */
  function parseCsv(file) {
    setCsvPreview([]);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data.map(r => ({
          vin: (r.vin || r.VIN || r.Vin || "").trim(),
          year: r.year || r.Year || "",
          make: r.make || r.Make || "",
          model: r.model || r.Model || "",
          trim: r.trim || r.Trim || "",
          price: r.price || r.Price || "",
          mileage: r.mileage || r.Mileage || "",
          location: r.location || r.Location || ""
        }));
        setCsvPreview(rows);
      },
      error: (err) => alert("CSV parse error: " + err.message)
    });
  }

  async function uploadCsv() {
    if (!csvPreview.length) return;
    try {
      const payload = csvPreview.map(r => ({
        vin: r.vin,
        year: r.year ? Number(r.year) : undefined,
        make: r.make, model: r.model, trim: r.trim || undefined,
        price: r.price ? Number(r.price) : undefined,
        mileage: r.mileage ? Number(r.mileage) : undefined,
        location: r.location || undefined
      }));
      const out = await http.post("/api/vehicles/import", payload);
      alert(`Import complete\nInserted: ${out.inserted}\nUpdated: ${out.updated}\nErrors: ${out.errors.length}`);
      setCsvPreview([]);
      await load();
    } catch (e) {
      alert("Import failed: " + (e?.message || "unknown"));
    }
  }

  return (
    <section style={{ maxWidth: 1100, margin: "24px auto" }}>
      <h2>Dealer Dashboard</h2>
      <p style={{ opacity: .8 }}>
        Signed in as <strong>{user.email}</strong>{user.dealerId ? ` (Dealer #${user.dealerId})` : ""}
      </p>

      <h3 style={{ marginTop: 24 }}>Add / Update Vehicle</h3>
      <form onSubmit={createVehicle} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        <input placeholder="VIN" value={form.vin} onChange={e => setForm({ ...form, vin: e.target.value })} />
        <input placeholder="Year" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
        <input placeholder="Make" value={form.make} onChange={e => setForm({ ...form, make: e.target.value })} />
        <input placeholder="Model" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
        <input placeholder="Trim" value={form.trim} onChange={e => setForm({ ...form, trim: e.target.value })} />
        <input placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
        <input placeholder="Mileage" value={form.mileage} onChange={e => setForm({ ...form, mileage: e.target.value })} />
        <input placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
        <div style={{ gridColumn: "1 / -1" }}>
          <button>Save Vehicle</button>
          <span style={{ marginLeft: 8, color: "#0a0" }}>{msg}</span>
        </div>
      </form>

      <h3 style={{ marginTop: 32 }}>Bulk Import (CSV)</h3>
      <p style={{ opacity: .8, marginTop: -6 }}>
        Headers can be <code>vin,year,make,model,trim,price,mileage,location</code> (case-insensitive).
      </p>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input type="file" accept=".csv" onChange={e => e.target.files?.[0] && parseCsv(e.target.files[0])} />
        <button disabled={!csvPreview.length} onClick={uploadCsv}>Upload {csvPreview.length ? `(${csvPreview.length})` : ""}</button>
        <button disabled={!csvPreview.length} onClick={() => setCsvPreview([])}>Clear</button>
      </div>
      {csvPreview.length > 0 && (
        <div style={{ marginTop: 10, maxHeight: 200, overflow: "auto", border: "1px solid #eee" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr><th>VIN</th><th>Year</th><th>Make</th><th>Model</th><th>Trim</th><th>Price</th><th>Mileage</th><th>Location</th></tr>
            </thead>
            <tbody>
              {csvPreview.slice(0, 50).map((r, i) => (
                <tr key={i}>
                  <td>{r.vin}</td><td>{r.year}</td><td>{r.make}</td><td>{r.model}</td><td>{r.trim}</td><td>{r.price}</td><td>{r.mileage}</td><td>{r.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ opacity: .6, padding: 6 }}>Showing first 50 of {csvPreview.length}</div>
        </div>
      )}

      <h3 style={{ marginTop: 32 }}>My Inventory</h3>
      {loading ? <div>Loading…</div> : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>Vehicle</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>VIN</th>
              <th style={{ textAlign: "right", borderBottom: "1px solid #ddd" }}>Price</th>
              <th style={{ textAlign: "right", borderBottom: "1px solid #ddd" }}>Mileage</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>Location</th>
              <th style={{ textAlign: "center", borderBottom: "1px solid #ddd" }}>Status</th>
              <th style={{ textAlign: "center", borderBottom: "1px solid #ddd" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map(v => (
              <tr key={v.vin}>
                <td>{v.year} {v.make} {v.model} {v.trim || ""}</td>
                <td>{v.vin}</td>
                <td style={{ textAlign: "right" }}>
                  {editing === v.vin
                    ? <input style={{ width: 100 }} value={editRow.price} onChange={e => setEditRow({ ...editRow, price: e.target.value })} />
                    : <Money v={v.price} />}
                </td>
                <td style={{ textAlign: "right" }}>
                  {editing === v.vin
                    ? <input style={{ width: 100 }} value={editRow.mileage} onChange={e => setEditRow({ ...editRow, mileage: e.target.value })} />
                    : (v.mileage?.toLocaleString() ?? "—")}
                </td>
                <td>
                  {editing === v.vin
                    ? <input style={{ width: 140 }} value={editRow.location} onChange={e => setEditRow({ ...editRow, location: e.target.value })} />
                    : (v.location || "—")}
                </td>
                <td style={{ textAlign: "center" }}>{v.inStock ? "In stock" : "Sold"}</td>
                <td style={{ textAlign: "center" }}>
                  {editing === v.vin ? (
                    <>
                      <button onClick={() => saveEdit(v.vin)}>Save</button>
                      <button onClick={cancelEdit} style={{ marginLeft: 6 }}>Cancel</button>
                    </>
                  ) : (
                    <>
                      {v.inStock && <button onClick={() => beginEdit(v)}>Edit</button>}
                      {v.inStock
                        ? <button onClick={() => markSold(v.vin)} style={{ marginLeft: 6 }}>Mark sold</button>
                        : <span style={{ opacity: .6, marginLeft: 6 }}>—</span>}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
