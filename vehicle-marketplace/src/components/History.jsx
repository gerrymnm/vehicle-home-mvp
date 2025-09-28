// Full file: vehicle-marketplace/src/components/History.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getVehicleHistory } from "../lib/api";

export default function History({ vin }) {
  const [type, setType] = useState("all"); // all | maintenance | accident | ownership
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  const options = useMemo(
    () => [
      { value: "all", label: "All" },
      { value: "maintenance", label: "Maintenance" },
      { value: "accident", label: "Accident" },
      { value: "ownership", label: "Ownership" },
    ],
    []
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await getVehicleHistory(vin, type);
        // backend returns { ok, type, count, events }
        setItems(Array.isArray(data.events) ? data.events : []);
      } catch (e) {
        setErr(String(e.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [vin, type]);

  return (
    <section>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
        <strong>History</strong>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      {loading && <p>Loading history…</p>}
      {err && <p style={{ color: "crimson" }}>Error: {err}</p>}
      {!loading && !err && items.length === 0 && <p>No history yet.</p>}
      <ul style={{ paddingLeft: 18, maxWidth: 760 }}>
        {items.map((ev, i) => (
          <li key={i} style={{ marginBottom: 6 }}>
            <span style={{ fontFamily: "monospace" }}>
              {ev.date ?? "YYYY-MM-DD"}
            </span>{" "}
            • <em>{ev.type ?? "event"}</em>{" "}
            {ev.note ? <span>— {ev.note}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
