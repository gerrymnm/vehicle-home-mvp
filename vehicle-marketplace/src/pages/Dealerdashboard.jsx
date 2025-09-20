import React from "react";
import { http } from "../lib/api.js";
import { useAuth } from "../lib/auth.jsx";

export default function DealerDashboard() {
  const { user } = useAuth();
  const [list, setList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [msg, setMsg] = React.useState("");
  const [form, setForm] = React.useState({
    vin:"", year:"", make:"", model:"", trim:"", price:"", mileage:"", location:""
  });

  async function load() {
    setLoading(true);
    try {
      // Get all and filter client-side to this dealer
      const data = await http.get("/api/vehicles?includeOutOfStock=true");
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
      year: Number(form.year),
      make: form.make.trim(),
      model: form.model.trim(),
      trim: form.trim.trim() || undefined,
      price: form.price ? Number(form.price) : undefined,
      mileage: form.mileage ? Number(form.mileage) : undefined,
      location: form.location || undefined
    };
    try {
      await http.post("/api/vehicles", payload);
      setForm({vin:"",year:"",make:"",model:"",trim:"",price:"",mileage:"",location:""});
      setMsg("Vehicle saved.");
      await load();
    } catch (e2) {
      setMsg("Failed to save vehicle.");
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

  return (
    <section style={{maxWidth:1100, margin:"24px auto"}}>
      <h2>Dealer Dashboard</h2>
      <p style={{opacity:.8}}>Signed in as <strong>{user.email}</strong>{user.dealerId ? ` (Dealer #${user.dealerId})` : ""}</p>

      <h3 style={{marginTop:24}}>Add / Update Vehicle</h3>
      <form onSubmit={createVehicle} style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8}}>
        <input placeholder="VIN" value={form.vin} onChange={e=>setForm({...form, vin:e.target.value})}/>
        <input placeholder="Year" value={form.year} onChange={e=>setForm({...form, year:e.target.value})}/>
        <input placeholder="Make" value={form.make} onChange={e=>setForm({...form, make:e.target.value})}/>
        <input placeholder="Model" value={form.model} onChange={e=>setForm({...form, model:e.target.value})}/>
        <input placeholder="Trim" value={form.trim} onChange={e=>setForm({...form, trim:e.target.value})}/>
        <input placeholder="Price" value={form.price} onChange={e=>setForm({...form, price:e.target.value})}/>
        <input placeholder="Mileage" value={form.mileage} onChange={e=>setForm({...form, mileage:e.target.value})}/>
        <input placeholder="Location" value={form.location} onChange={e=>setForm({...form, location:e.target.value})}/>
        <div style={{gridColumn:"1 / -1"}}>
          <button>Save Vehicle</button>
          <span style={{marginLeft:8, color:"#0a0"}}>{msg}</span>
        </div>
      </form>

      <h3 style={{marginTop:32}}>My Inventory</h3>
      {loading ? <div>Loading…</div> : (
        <table style={{width:"100%", borderCollapse:"collapse"}}>
          <thead>
            <tr>
              <th style={{textAlign:"left", borderBottom:"1px solid #ddd"}}>Vehicle</th>
              <th style={{textAlign:"left", borderBottom:"1px solid #ddd"}}>VIN</th>
              <th style={{textAlign:"right", borderBottom:"1px solid #ddd"}}>Price</th>
              <th style={{textAlign:"right", borderBottom:"1px solid #ddd"}}>Mileage</th>
              <th style={{textAlign:"center", borderBottom:"1px solid #ddd"}}>Status</th>
              <th style={{textAlign:"center", borderBottom:"1px solid #ddd"}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map(v => (
              <tr key={v.vin}>
                <td>{v.year} {v.make} {v.model} {v.trim || ""}</td>
                <td>{v.vin}</td>
                <td style={{textAlign:"right"}}>{v.price ? `$${v.price.toLocaleString()}` : "—"}</td>
                <td style={{textAlign:"right"}}>{v.mileage?.toLocaleString() ?? "—"}</td>
                <td style={{textAlign:"center"}}>{v.inStock ? "In stock" : "Sold"}</td>
                <td style={{textAlign:"center"}}>
                  {v.inStock
                    ? <button onClick={()=>markSold(v.vin)}>Mark sold</button>
                    : <span style={{opacity:.6}}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
