// Full file: vehicle-marketplace/src/pages/DealerDashboard.jsx
import React, { useEffect, useState } from "react";
import api from "../lib/api.js";
import auth from "../lib/auth.js";
import { Link } from "react-router-dom";

export default function DealerDashboard() {
  const [user, setUser] = useState(null);
  const [inv, setInv] = useState({ ok: true, items: [], total: 0, page: 1, totalPages: 1 });
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setErr("");
      // who am I
      const u = await auth.me();
      if (alive) setUser(u);
      // inventory (placeholder for now)
      try {
        const r = await api.dealerInventory({ page: 1, pageSize: 25 });
        if (alive) setInv(r);
      } catch (e) {
        if (alive) setErr(String(e.message || e));
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <main className="container">
      <div className="bar" style={{ justifyContent: "space-between" }}>
        <h1>Dealer Dashboard</h1>
        <div style={{ display: "flex", gap: 12 }}>
          {user ? <span className="muted">Signed in as {user.name || user.email}</span> : (
            <>
              <Link to="/login">Login</Link>
              <span className="muted">/</span>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </div>

      {err && <p style={{ color: "crimson" }}>Error: {err}</p>}

      {inv.items.length === 0 ? (
        <div className="card" style={{ maxWidth: 520 }}>
          <h3 style={{ marginTop: 0 }}>No inventory yet</h3>
          <p className="muted">When vehicles are added, they’ll appear here.</p>
          <p className="muted">Next step will be adding an “Add Vehicle” flow.</p>
        </div>
      ) : (
        <table className="table">
          <thead>
            <tr><th>VIN</th><th>Title</th><th>Price</th><th>Mileage</th><th>Status</th></tr>
          </thead>
          <tbody>
            {inv.items.map((v) => (
              <tr key={v.vin}>
                <td><Link to={`/vehicles/${v.vin}`}>{v.vin}</Link></td>
                <td>{v.title || `${v.year} ${v.make} ${v.model}`}</td>
                <td>{v.price ? `$${Number(v.price).toLocaleString()}` : "—"}</td>
                <td>{v.mileage ? `${Number(v.mileage).toLocaleString()} mi` : "—"}</td>
                <td>{v.in_stock ? "in stock" : "not in stock"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
