// Full file: vehicle-marketplace/src/components/History.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getVehicleHistory } from "../lib/api.js";

export default function History({ vin }) {
  const [type, setType] = useState("all"); // all | maintenance | accident | ownership
  const [data, setData] = useState({ ok: true, type: "all", count: 0, events: [] });
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      setErr("");
      try {
        const res = await getVehicleHistory(vin, type);
        if (alive) setData(res);
      } catch (e) {
        if (alive) setErr(String(e.message || e));
      }
    })();
    return () => { alive = false; };
  }, [vin, type]);

  const events = useMemo(() => data?.events || [], [data]);

  return (
    <div>
      <div className="bar" style={{ gap: 8, alignItems: "center" }}>
        <label htmlFor="history-type" style={{ fontWeight: 600 }}>History</label>
        <select id="history-type" value={type} onChange={(e)=>setType(e.target.value)}>
          <option value="all">All</option>
          <option value="maintenance">Maintenance</option>
          <option value="accident">Accident</option>
          <option value="ownership">Ownership</option>
        </select>
      </div>

      {err && <p style={{ color: "crimson" }}>Error: {err}</p>}
      {!err && events.length === 0 && <p className="muted">No history yet.</p>}

      {events.length > 0 && (
        <ul style={{ marginTop: 8 }}>
          {events.map((e, i) => (
            <li key={i}>
              <strong style={{ textTransform: "capitalize" }}>{e.type}</strong>
              {e.date ? ` — ${e.date}` : ""}{e.title ? ` — ${e.title}` : ""}
              {e.odometer != null ? ` — ${e.odometer.toLocaleString()} mi` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
