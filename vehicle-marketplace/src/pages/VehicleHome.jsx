import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api.js";

/**
 * Vehicle Home (VDP)
 * - Shows core vehicle info
 * - Photos
 * - Lien / Inspection / Compliance
 * - History with filter (All / Maintenance / Incidents / Ownership)
 *
 * Notes:
 * - Images are read from `vehicle.images` (array of URLs or IPFS gateways)
 * - History is read from `history` array, each item: { id, ts, kind, label, details }
 *   where kind ∈ ["maintenance","incident","ownership","other"]
 * - Compliance: smog/nmvtis/ksr summary from the vehicle payload if present
 */

const box = {
  maxWidth: 920,
  margin: "24px auto",
  padding: "0 16px",
  lineHeight: 1.4,
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
};

const h1 = { fontSize: 20, fontWeight: 700, margin: "0 0 8px" };
const small = { fontSize: 12, color: "#666" };
const sectionTitle = { fontWeight: 700, margin: "20px 0 8px" };
const row = { margin: "4px 0" };
const errorText = { color: "#b00020", marginTop: 8 };
const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
  gap: 8,
};
const imgStyle = {
  width: "100%",
  height: 120,
  objectFit: "cover",
  border: "1px solid #eee",
  borderRadius: 4,
  background: "#fafafa",
};
const selectStyle = {
  height: 28,
  padding: "2px 8px",
  border: "1px solid #ccc",
  borderRadius: 4,
};

export default function VehicleHome() {
  const { vin } = useParams();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [vehicle, setVehicle] = useState(null);
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState("all");

  // Optional: surface a simple role (dealer/consumer/etc.) saved elsewhere
  const role = (typeof localStorage !== "undefined" && localStorage.getItem("role")) || "consumer";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await api.vehicles.getByVin(vin);
        if (!res?.ok) throw new Error(res?.error || "Failed to load vehicle");
        if (cancelled) return;
        setVehicle(res.vehicle || null);
        setHistory(Array.isArray(res.history) ? res.history : []);
      } catch (e) {
        if (!cancelled) setErr(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => (cancelled = true);
  }, [vin]);

  const filteredHistory = useMemo(() => {
    if (!filter || filter === "all") return history;
    return history.filter((h) => (h?.kind || "other") === filter);
  }, [history, filter]);

  const fmtMoney = (n) =>
    typeof n === "number"
      ? n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })
      : "";

  if (loading) {
    return (
      <div style={box}>
        <div style={small}>Secured on blockchain</div>
        <div style={{ margin: "12px 0" }}>
          <Link to="/search">← Back to search</Link>
        </div>
        <p>Loading vehicle…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div style={box}>
        <div style={small}>Secured on blockchain</div>
        <div style={{ margin: "12px 0" }}>
          <Link to="/search">← Back to search</Link>
        </div>
        <div style={errorText}>Error: {err}</div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div style={box}>
        <div style={small}>Secured on blockchain</div>
        <div style={{ margin: "12px 0" }}>
          <Link to="/search">← Back to search</Link>
        </div>
        <p>No vehicle found.</p>
      </div>
    );
  }

  const title = [
    vehicle.year,
    vehicle.make,
    [vehicle.model, vehicle.trim].filter(Boolean).join(" "),
  ]
    .filter(Boolean)
    .join(" ");

  const metaLine = [
    vehicle.vin ? `VIN: ${vehicle.vin}` : null,
    vehicle.price ? fmtMoney(vehicle.price) : null,
    vehicle.mileage ? `${Number(vehicle.mileage).toLocaleString()} miles` : null,
    vehicle.location || null,
  ]
    .filter(Boolean)
    .join(" • ");

  // Normalize compliance
  const smog = vehicle?.compliance?.smog ?? "unknown";
  const nmvtis = vehicle?.compliance?.nmvtis ?? { brands: "unknown", theft: "unknown" };
  const ksr = vehicle?.compliance?.ksr ?? null;

  return (
    <div style={box}>
      <div style={small}>Secured on blockchain</div>
      <div style={{ margin: "12px 0" }}>
        <Link to="/search">← Back to search</Link>
      </div>

      <h1 style={h1}>{title || "Vehicle"}</h1>
      {metaLine ? <div style={{ marginBottom: 12 }}>{metaLine}</div> : null}
      <div style={row}>Status: {vehicle.in_stock ? "In stock" : vehicle.status || "Unknown"}</div>

      {/* Photos */}
      <div style={sectionTitle}>Photos</div>
      {Array.isArray(vehicle.images) && vehicle.images.length > 0 ? (
        <div style={grid}>
          {vehicle.images.slice(0, 100).map((src, i) => (
            <img key={i} src={src} alt={`photo ${i + 1}`} style={imgStyle} loading="lazy" />
          ))}
        </div>
      ) : (
        <div style={small}>No photos yet.</div>
      )}

      {/* Lien */}
      <div style={sectionTitle}>Lien</div>
      {vehicle?.lien ? (
        <div>
          <div style={row}>Status: {vehicle.lien.status || "unknown"}</div>
          <div style={row}>Lender: {vehicle.lien.lender || "—"}</div>
          <div style={row}>Title held by: {vehicle.lien.title_holder || "—"}</div>
          <div style={row}>
            Payoff: {vehicle.lien.payoff ? fmtMoney(vehicle.lien.payoff) : "—"}
            {typeof vehicle.lien.per_diem === "number" ? ` (per diem ${fmtMoney(vehicle.lien.per_diem)} /day)` : ""}
          </div>
          <div style={small}>
            Same-day payoff & instant funding are supported once bank rails are connected.
          </div>
        </div>
      ) : (
        <div style={small}>No active lien reported.</div>
      )}

      {/* Inspection */}
      <div style={sectionTitle}>Dealership Inspection</div>
      {vehicle?.inspection ? (
        <div>
          <div style={row}>Tire life: {vehicle.inspection.tires ?? "—"}</div>
          <div style={row}>Brake life: {vehicle.inspection.brakes ?? "—"}</div>
          {vehicle.inspection.notes ? <div style={row}>Notes: {vehicle.inspection.notes}</div> : null}
        </div>
      ) : (
        <div style={small}>Not provided.</div>
      )}

      {/* Compliance */}
      <div style={sectionTitle}>Compliance & Records</div>
      <div style={row}>Smog: {String(smog)}</div>
      <div style={row}>
        NMVTIS: brands {String(nmvtis.brands ?? "unknown")} • Theft: {String(nmvtis.theft ?? "unknown")}
      </div>
      <div style={row}>KSR: {ksr ? String(ksr) : "Not provided"}</div>

      {/* History */}
      <div style={{ ...sectionTitle, display: "flex", alignItems: "center", gap: 12 }}>
        <span>History</span>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={selectStyle} aria-label="History filter">
          <option value="all">All</option>
          <option value="maintenance">Maintenance</option>
          <option value="incident">Accident/Damage</option>
          <option value="ownership">Ownership</option>
        </select>
      </div>

      {filteredHistory.length === 0 ? (
        <div style={small}>No history yet.</div>
      ) : (
        <div>
          {filteredHistory.map((h) => (
            <div key={h.id || `${h.kind}-${h.ts}-${Math.random()}`} style={{ margin: "8px 0" }}>
              <div style={{ fontWeight: 600 }}>
                {h.label || (h.kind ? h.kind[0].toUpperCase() + h.kind.slice(1) : "Event")}
              </div>
              <div style={small}>
                {h.ts ? new Date(h.ts).toLocaleString() : ""} {h.source ? `• ${h.source}` : ""}
              </div>
              {h.details ? <div style={{ marginTop: 4 }}>{h.details}</div> : null}
            </div>
          ))}
        </div>
      )}

      {/* Dealer-only helper (future upload wiring) */}
      {role === "dealer" ? (
        <aside style={{ marginTop: 24 }}>
          <div style={small}>
            Dealer tools: image upload & on-chain events will appear here (requires backend routes to save images and
            write event logs).
          </div>
        </aside>
      ) : null}
    </div>
  );
}
