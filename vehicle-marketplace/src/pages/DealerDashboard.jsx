// Full file: vehicle-marketplace/src/pages/DealerDashboard.jsx
import React, { useEffect, useState } from "react";
import { logout, getUser } from "../lib/auth";
import { dealerInventory } from "../lib/api";

export default function DealerDashboard() {
  const [user] = useState(getUser());
  const [inv, setInv] = useState({ items: [], page: 1, pageSize: 25, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await dealerInventory({});
      if (alive) { setInv(res); setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div>
      <h2>Dealer Dashboard</h2>
      <p className="muted" style={{ marginTop: -8 }}>Hello{user?.name ? `, ${user.name}` : ""}! {user?.email ? `(${user.email})` : ""}</p>

      <div className="section">
        <h3>Inventory</h3>
        {loading ? <p>Loading…</p> : inv.items.length === 0 ? (
          <p className="muted">No inventory yet. This section is a skeleton and will populate once the backend endpoint is ready.</p>
        ) : (
          <ul>
            {inv.items.map((v) => (
              <li key={v.vin}>{[v.year, v.make, v.model, v.trim].filter(Boolean).join(" ")} — VIN {v.vin}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="section">
        <h3>Leads</h3>
        <p className="muted">Coming soon…</p>
      </div>

      <div className="section">
        <button onClick={() => { logout(); window.location.assign("/login"); }}>
          Log out
        </button>
      </div>
    </div>
  );
}
