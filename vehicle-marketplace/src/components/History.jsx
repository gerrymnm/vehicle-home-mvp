import React, { useEffect, useMemo, useState } from "react";
import api from "../lib/api.js";

const TYPES = [
  { value: "all", label: "All" },
  { value: "maintenance", label: "Maintenance" },
  { value: "accident", label: "Accident" },
  { value: "ownership", label: "Ownership" },
];

export default function History({ vin }) {
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  const title = useMemo(() => TYPES.find((t) => t.value === type)?.label ?? "All", [type]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");
    api
      .history(vin, type)
      .then((r) => {
        if (!alive) return;
        const list = Array.isArray(r?.events) ? r.events : Array.isArray(r) ? r : [];
        setItems(list);
      })
      .catch((e) => {
        if (alive) setErr(e?.message || "Failed to load history");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [vin, type]);

  return (
    <section>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>History</h3>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ padding: "6px 8px" }}
        >
          {TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {loading && <p style={{ color: "#666" }}>Loading history…</p>}
      {err && <p style={{ color: "crimson" }}>Error: {err}</p>}
      {!loading && !err && items.length === 0 && <p style={{ color: "#666" }}>No history yet.</p>}

      {items.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              borderCollapse: "collapse",
              width: "100%",
              maxWidth: 900,
              border: "1px solid #e5e5e5",
            }}
          >
            <thead style={{ background: "#fafafa" }}>
              <tr>
                <th style={th}>Date</th>
                <th style={th}>Type</th>
                <th style={th}>Title</th>
                <th style={th}>Details</th>
              </tr>
            </thead>
            <tbody>
              {items.map((ev, i) => (
                <tr key={i}>
                  <td style={td}>{ev.date ?? ""}</td>
                  <td style={td}>{ev.type ?? ""}</td>
                  <td style={td}>{ev.title ?? ""}</td>
                  <td style={td}>{ev.details ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const th = { textAlign: "left", padding: "8px 10px", borderBottom: "1px solid #e5e5e5" };
const td = { padding: "8px 10px", borderBottom: "1px solid #f0f0f0", verticalAlign: "top" };
