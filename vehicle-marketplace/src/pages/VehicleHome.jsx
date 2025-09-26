import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api.js";

export default function VehicleHome() {
  const { vin } = useParams();
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [histFilter, setHistFilter] = useState("all"); // all|maintenance|accident|ownership

  useEffect(() => {
    (async () => {
      setErr(""); setLoading(true);
      try {
        const r = await api.vehicle(vin);
        setData(r);
      } catch (e) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [vin]);

  const { vehicle, lien, history, inspection, smog, nmvtis } = data || {};

  const filteredHistory = useMemo(() => {
    if (!history) return [];
    if (histFilter === "all") return history;
    return history.filter(h => (h.type || "").toLowerCase().includes(histFilter));
  }, [history, histFilter]);

  return (
    <div style={{ padding: "24px 24px 120px 24px", maxWidth: 1080, margin: "0 auto" }}>
      <div style={{ fontSize: 12, color: "#444", marginBottom: 4 }}>Secured on blockchain</div>

      <div style={{ marginBottom: 12 }}>
        <Link to="/search">← Back to search</Link>
      </div>

      {loading && <p>Loading vehicle…</p>}
      {err && <p style={{ color: "crimson" }}>Error: {err}</p>}
      {!loading && !err && vehicle && (
        <>
          <h1 style={{ margin: "0 0 8px 0", fontSize: 22 }}>
            {vehicle.year ? `${vehicle.year} ` : ""}{vehicle.make} {vehicle.model} {vehicle.trim}
          </h1>
          <div style={{ color: "#333", marginBottom: 8 }}>
            <p style={{ margin: 0 }}>
              VIN: <b>{vehicle.vin}</b>
            </p>
            <p style={{ margin: 0 }}>
              {vehicle.price != null ? `$${Number(vehicle.price).toLocaleString()}` : ""}{" "}
              {vehicle.mileage ? `• ${Number(vehicle.mileage).toLocaleString()} miles` : ""}{" "}
              {vehicle.location ? `• ${vehicle.location}` : ""}{" "}
            </p>
            <p style={{ margin: 0 }}>
              Status: <b>{vehicle.status || "Unknown"}</b>
            </p>
            {(vehicle.engine || vehicle.transmission) && (
              <p style={{ margin: 0 }}>
                {vehicle.engine ? `Engine: ${vehicle.engine}` : ""}{vehicle.engine && vehicle.transmission ? " • " : ""}
                {vehicle.transmission ? `Transmission: ${vehicle.transmission}` : ""}
              </p>
            )}
          </div>

          {/* Photos */}
          {vehicle.images?.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 8, margin: "16px 0" }}>
              {vehicle.images.map((u, i) => (
                <img key={i} src={u} alt={`photo-${i}`} style={{ width: "100%", height: 120, objectFit: "cover", border: "1px solid #eee" }} />
              ))}
            </div>
          ) : (
            <p style={{ color: "#777" }}>No photos yet.</p>
          )}

          {/* Lien */}
          <section style={{ marginTop: 24 }}>
            <h3 style={{ margin: "0 0 8px 0" }}>Lien</h3>
            {lien?.lender || lien?.hasLien ? (
              <div>
                <p style={{ margin: 0 }}>Lender: <b>{lien.lender}</b></p>
                <p style={{ margin: 0 }}>
                  Amount owed: {lien.amount_owed != null ? `$${Number(lien.amount_owed).toLocaleString()}` : "Unknown"}
                </p>
                <p style={{ margin: 0 }}>
                  Per diem: {lien.per_diem != null ? `$${Number(lien.per_diem).toLocaleString()}` : "Unknown"} • 10-day payoff available
                </p>
                <p style={{ margin: 0 }}>Title with: {lien.title_with ?? "Unknown"}</p>
                <p style={{ margin: 0 }}>Same-day payoff: {lien.same_day_payoff ? "Yes" : "No"}</p>
              </div>
            ) : (
              <p>No active lien reported.</p>
            )}
          </section>

          {/* Inspection */}
          <section style={{ marginTop: 24 }}>
            <h3 style={{ margin: "0 0 8px 0" }}>Dealership Inspection</h3>
            {inspection?.tires || inspection?.brakes || inspection?.notes ? (
              <div>
                {inspection.tires && <p style={{ margin: 0 }}>Tires: {inspection.tires}</p>}
                {inspection.brakes && <p style={{ margin: 0 }}>Brakes: {inspection.brakes}</p>}
                {inspection.notes && <p style={{ margin: 0 }}>Notes: {inspection.notes}</p>}
              </div>
            ) : (
              <p>Not provided.</p>
            )}
          </section>

          {/* Smog / NMVTIS / KSR */}
          <section style={{ marginTop: 24 }}>
            <h3 style={{ margin: "0 0 8px 0" }}>Compliance & Records</h3>
            <p style={{ margin: 0 }}>
              Smog: {smog?.status ?? "Unknown"}{smog?.date ? ` • ${new Date(smog.date).toLocaleDateString()}` : ""}{smog?.station ? ` • ${smog.station}` : ""}
            </p>
            <p style={{ margin: 0 }}>
              NMVTIS: brands {Array.isArray(nmvtis?.brands) ? nmvtis.brands.join(", ") || "None" : "Unknown"} • Theft: {nmvtis?.theft ? "Yes" : "No"}
            </p>
            <p style={{ margin: 0 }}>KSR: {data?.ksr ? "Available" : "Not provided"}</p>
          </section>

          {/* History with filter */}
          <section style={{ marginTop: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h3 style={{ margin: "0 8px 8px 0" }}>History</h3>
              <select value={histFilter} onChange={e => setHistFilter(e.target.value)} style={{ padding: "4px 8px" }}>
                <option value="all">All</option>
                <option value="maintenance">Maintenance</option>
                <option value="accident">Accidents/Damage</option>
                <option value="ownership">Ownership</option>
              </select>
            </div>
            {filteredHistory.length ? (
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                {filteredHistory.map(h => (
                  <li key={h.id} style={{ marginBottom: 6 }}>
                    <span style={{ color: "#444" }}>
                      [{(h.type || "note").toUpperCase()}] {h.summary || ""}
                      {h.at ? ` • ${new Date(h.at).toLocaleString()}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No history yet.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
