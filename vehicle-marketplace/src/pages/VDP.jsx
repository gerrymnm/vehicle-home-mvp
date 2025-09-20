import React from "react";
import { useParams } from "react-router-dom";
import { fetchVehicle, fetchMetrics } from "../api";

export default function VDP() {
  const { vin } = useParams();
  const [v, setV] = React.useState(null);
  const [metrics, setMetrics] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancel = false;
    setLoading(true);
    (async () => {
      try {
        const veh = await fetchVehicle(vin);
        const m = await fetchMetrics({ make: veh.make, model: veh.model, trim: veh.trim });
        if (!cancel) {
          setV(veh);
          setMetrics(m);
        }
      } catch (e) {
        console.error(e);
        if (!cancel) setV(null);
      } finally {
        !cancel && setLoading(false);
      }
    })();
    return () => (cancel = true);
  }, [vin]);

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!v) return <div style={{ padding: 24 }}>Vehicle not found.</div>;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24 }}>
      <div style={{ border: "1px solid #eee", borderRadius: 16, padding: 16 }}>
        <h2 style={{ margin: 0 }}>
          {v.year} {v.make} {v.model} {v.trim ? `· ${v.trim}` : ""}
        </h2>
        <div style={{ color: "#666", marginBottom: 8 }}>{v.vin}</div>

        <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
          <Badge label={v.inStock === false ? "Owned (individual)" : "For sale (dealer)"} danger={v.inStock === false} />
          <Badge label={v.location || "—"} />
        </div>

        <div style={{ fontSize: 28, fontWeight: 800, margin: "12px 0" }}>
          {typeof v.price === "number" ? v.price.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }) : "—"}
        </div>

        <ul style={{ lineHeight: 1.7 }}>
          <li>Mileage: {v.mileage?.toLocaleString() ?? "—"}</li>
          <li>Trim: {v.trim || "—"}</li>
          <li>Year: {v.year}</li>
        </ul>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <Panel title="Market Snapshot">
          <Row label="Available now">{metrics?.count ?? "—"}</Row>
          <Row label="Average price">{money(metrics?.avgPrice)}</Row>
          <Row label="Lowest / Highest">
            {metrics?.minPrice != null || metrics?.maxPrice != null
              ? `${money(metrics?.minPrice)} / ${money(metrics?.maxPrice)}`
              : "—"}
          </Row>
          <Row label="Price trend">{prettyTrend(metrics?.trend)}</Row>
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div style={{ border: "1px solid #eee", borderRadius: 16, padding: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px dashed #f0f0f0" }}>
      <div style={{ color: "#666" }}>{label}</div>
      <div style={{ fontWeight: 600 }}>{children}</div>
    </div>
  );
}

function Badge({ label, danger }) {
  return (
    <div style={{
      padding: "4px 10px",
      borderRadius: 999,
      fontSize: 12,
      background: danger ? "#ffe8e8" : "#eef9f1",
      border: "1px solid #ddd"
    }}>
      {label}
    </div>
  );
}

function money(x) {
  return typeof x === "number"
    ? x.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "—";
}
function prettyTrend(t) {
  if (!t) return "—";
  if (t === "up") return "↑ Up";
  if (t === "down") return "↓ Down";
  return "→ Flat";
}
