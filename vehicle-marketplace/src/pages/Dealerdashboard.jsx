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
  const [errors, setErrors] = React.useState({});

  // inline edit state
  const [editing, setEditing] = React.useState(null); // vin currently editing
  const [editRow, setEditRow] = React.useState({ price: "", mileage: "", location: "" });

  // CSV import preview
  const [csvPreview, setCsvPreview] = React.useState([]);

  /* ---------------- data ---------------- */
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

  /* ---------------- validation ---------------- */
  function validate(f) {
    const e = {};
    if (!f.vin || !String(f.vin).trim()) e.vin = "VIN is required";
    if (f.year !== "" && !/^\d{4}$/.test(String(f.year))) e.year = "Year must be 4 digits";
    if (f.price !== "" && isNaN(Number(f.price))) e.price = "Price must be a number";
    if (f.mileage !== "" && (!/^\d+$/.test(String(f.mileage)))) e.mileage = "Mileage must be an integer";
    return e;
  }
  function onFormChange(name, value) {
    const next = { ...form, [name]: value };
    setForm(next);
    setErrors(validate(next));
  }

  /* ---------------- create/update (top form) ---------------- */
  async function createVehicle(e) {
    e.preventDefault();
    const vErr = validate(form);
    setErrors(vErr);
    if (Object.keys(vErr).length) return;

    setMsg("");
    const payload = {
      vin: form.vin.trim().toUpperCase(),
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
      setErrors({});
      setMsg("Vehicle saved.");
      await load();
    } catch (e2) {
      console.error(e2);
      setMsg("Failed to save vehicle.");
    }
  }

  /* ---------------- inline edit ---------------- */
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
    const patch = {};
    if (editRow.price !== "") {
      if (isNaN(Number(editRow.price))) return alert("Price must be a number");
      patch.price = Number(editRow.price);
    }
    if (editRow.mileage !== "") {
      if (!/^\d+$/.test(String(editRow.mileage))) return alert("Mileage must be an integer");
      patch.mileage = Number(editRow.mileage);
    }
    if (String(editRow.location).trim() !== "") patch.location = String(editRow.location).trim();
    try {
      await http.patch(`/api/vehicles/${encodeURIComponent(vin)}`, patch);
      setEditing(null);
      await load();
    } catch {
      alert("Failed to save changes");
    }
  }

  /* ---------------- actions ---------------- */
  async function markSold(vin) {
    try {
      await http.post(`/api/vehicles/${encodeURIComponent(vin)}/sold`, { note: "Sold from dashboard" });
      await load();
    } catch {
      alert("Failed to mark sold");
    }
  }

  async function unmarkSold(vin) {
    try {
      await http.patch(`/api/vehicles/${encodeURIComponent(vin)}`, { inStock: true });
      await load();
    } catch {
      alert("Failed to unmark sold");
    }
  }

  async function deleteVehicle(vin) {
    if (!confirm(`Delete vehicle ${vin}? This cannot be undone.`)) return;
    try {
      if (typeof http.delete === "function") {
        await http.delete(`/api/vehicles/${encodeURIComponent(vin)}`);
      } else if (typeof http.del === "function") {
        await http.del(`/api/vehicles/${encodeURIComponent(vin)}`);
      } else {
        // fallback; most setups won't hit this
        const url = (import.meta.env?.VITE_API_BASE_URL || "") + `/api/vehicles/${encodeURIComponent(vin)}`;
        await fetch(url, { method: "DELETE", credentials: "include" });
      }
      await load();
    } catch {
      alert("Failed to delete vehicle");
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
          vin: (r.vin || r.VIN || r.Vin || "").trim().toUpperCase(),
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

  function downloadTemplate() {
    const header = "vin,year,make,model,trim,price,mileage,location\n";
    const example = "1C4RJFBG0LC123456,2020,Jeep,Grand Cherokee,Limited,29950,42000,San Rafael, CA\n";
    const blob = new Blob([header + example], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "inventory_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const saveDisabled = !!Object.keys(errors).length || !form.vin.trim();

  return (
    <section style={{ maxWidth: 1100, margin: "24px auto" }}>
      <h2>Dealer Dashboard</h2>
      <p style={{ opacity: .8 }}>
        Signed in as <strong>{user.email}</strong>{user.dealerId ? ` (Dealer #${user.dealerId})` : ""}
      </p>

      <h3 style={{ marginTop: 24 }}>Add / Update Vehicle</h3>
      <form onSubmit={createVehicle} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        <div>
          <input placeholder="VIN" value={form.vin} onChange={e => onFormChange("vin", e.target.value)} onBlur={e => onFormChange("vin", e.target.value.toUpperCase())} />
          {errors.vin && <div style={{ color: "#b00", fontSize: 12 }}>{errors.vin}</div>}
        </div>
        <div>
          <input placeholder="Year" value={form.year} onChange={e => onFormChange("year", e.target.value)} />
          {errors.year && <div style={{ color: "#b00", fontSize: 12 }}>{errors.year}</div>}
        </div>
        <input placeholder="Make" value={form.make} onChange={e => onFormChange("make", e.target.value)} />
        <input placeholder="Model" value={form.model} onChange={e => onFormChange("model", e.target.value)} />
        <input placeholder="Trim" value={form.trim} onChange={e => onFormChange("trim", e.target.value)} />
        <div>
          <input placeholder="Price" value={form.price} onChange={e => onFormChange("price", e.target.value)} />
          {errors.price && <div style={{ color: "#b00", fontSize: 12 }}>{errors.price}</div>}
        </div>
        <div>
          <input placeholder="Mileage" value={form.mileage} onChange={e => onFormChange("mileage", e.target.value)} />
          {errors.mileage && <div style={{ color: "#b00", fontSize: 12 }}>{errors.mileage}</div>}
        </div>
        <input placeholder="Location" value={form.location} onChange={e => onFormChange("location", e.target.value)} />
        <div style={{ gridColumn: "1 / -1" }}>
          <button disabled={saveDisabled} title={saveDisabled ? "Fix validation errors first" : ""}>Save Vehicle</button>
          <span style={{ marginLeft: 8, color: "#0a0" }}>{msg}</span>
        </div>
      </form>

      <h3 style={{ marginTop: 32 }}>Bulk Import (CSV)</h3>
      <p style={{ opacity: .8, marginTop: -6 }}>
        Headers can be <code>vin,year,make,model,trim,price,mileage,location</code> (case-insensitive).
      </p>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <input type="file" accept=".csv" onChange={e => e.target.files?.[0] && parseCsv(e.target.files[0])} />
        <button disabled={!csvPreview.length} onClick={uploadCsv}>Upload {csvPreview.length ? `(${csvPreview.length})` : ""}</button>
        <button disabled={!csvPreview.length} onClick={() => setCsvPreview([])}>Clear</button>
        <button onClick={downloadTemplate}>Download template (.csv)</button>
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
                  {v.inStock ? (
                    editing === v.vin ? (
                      <>
                        <button onClick={() => saveEdit(v.vin)}>Save</button>
                        <button onClick={cancelEdit} style={{ marginLeft: 6 }}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => beginEdit(v)}>Edit</button>
                        <button onClick={() => markSold(v.vin)} style={{ marginLeft: 6 }}>Mark sold</button>
                        <button onClick={() => deleteVehicle(v.vin)} style={{ marginLeft: 6 }}>Delete</button>
                      </>
                    )
                  ) : (
                    <>
                      <button onClick={() => unmarkSold(v.vin)}>Unmark sold</button>
                      <button onClick={() => deleteVehicle(v.vin)} style={{ marginLeft: 6 }}>Delete</button>
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
