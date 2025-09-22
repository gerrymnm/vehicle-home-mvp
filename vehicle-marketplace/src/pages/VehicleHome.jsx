import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useLocation } from "react-router-dom";
import { apiUrl } from "../lib/api.js";
import ImageUploader from "../components/ImageUploader.jsx";

export default function VehicleHome() {
  const { vin: vinFromPath } = useParams();
  const location = useLocation();
  const vin = vinFromPath || new URLSearchParams(location.search).get("q") || "";
  const [data, setData] = useState({ vehicle: null, images: [], history: [], metrics: null, lien: null, inspection: null, anchor: null });
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");
  const role = localStorage.getItem("role") || "consumer";

  useEffect(() => {
    let alive = true;
    async function load() {
      setError("");
      setData({ vehicle: null, images: [], history: [], metrics: null, lien: null, inspection: null, anchor: null });
      if (!vin) return;
      const r = await fetch(apiUrl(`/api/vehicles/${encodeURIComponent(vin)}`), { credentials: "omit" });
      if (!r.ok) {
        if (!alive) return;
        setError("Failed to load vehicle");
        return;
      }
      const j = await r.json();
      if (!alive) return;
      if (!j?.vehicle) {
        setError("Not found");
        return;
      }
      setData(j);
    }
    load();
    return () => {
      alive = false;
    };
  }, [vin]);

  const v = data.vehicle;
  const hist = useMemo(() => {
    if (!data.history) return [];
    if (tab === "all") return data.history;
    return data.history.filter((e) => e.type === tab);
  }, [data.history, tab]);

  function addImage(url) {
    setData((d) => ({ ...d, images: [url, ...(d.images || [])] }));
  }

  async function saveLien(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await fetch(apiUrl(`/api/vehicles/${encodeURIComponent(vin)}/lien`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify({
        lender: f.get("lender") || null,
        title_with: f.get("title_with") || null,
        payoff_cents: f.get("payoff") ? Math.round(Number(f.get("payoff")) * 100) : null,
        per_diem_cents: f.get("per_diem") ? Math.round(Number(f.get("per_diem")) * 100) : null,
        payoff_10day_cents: f.get("payoff10") ? Math.round(Number(f.get("payoff10")) * 100) : null,
      }),
    });
    const r = await fetch(apiUrl(`/api/vehicles/${encodeURIComponent(vin)}`));
    setData(await r.json());
  }

  async function saveInspection(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const tires = {
      lf: Number(f.get("t_lf") || 0),
      rf: Number(f.get("t_rf") || 0),
      lr: Number(f.get("t_lr") || 0),
      rr: Number(f.get("t_rr") || 0),
    };
    const brakes = {
      front: Number(f.get("b_front") || 0),
      rear: Number(f.get("b_rear") || 0),
    };
    await fetch(apiUrl(`/api/vehicles/${encodeURIComponent(vin)}/inspection`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
      body: JSON.stringify({
        tires,
        brakes,
        notes: f.get("notes") || "",
        inspector: f.get("inspector") || "",
      }),
    });
    const r = await fetch(apiUrl(`/api/vehicles/${encodeURIComponent(vin)}`));
    setData(await r.json());
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 12, color: "#555" }}>Secured on blockchain</div>
      <div style={{ marginBottom: 12 }}>
        <Link to="/search">← Back to search</Link>
      </div>

      {error && <div style={{ color: "red" }}>Error: {error}</div>}
      {v && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, marginBottom: 6 }}>
              {v.year} {v.make} {v.model} {v.trim || ""}
            </h1>
            <div style={{ marginBottom: 6 }}>VIN: {v.vin}</div>
            <div style={{ marginBottom: 6 }}>
              ${v.price?.toLocaleString?.() || "—"} • {v.mileage?.toLocaleString?.() || "—"} miles • {v.location || "—"}
            </div>
            <div style={{ marginBottom: 12 }}>Status: {v.status || "In stock"}</div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {data.images?.length
                ? data.images.map((u) => (
                    <img key={u} src={u} alt="" style={{ width: 160, height: 120, objectFit: "cover", borderRadius: 6, border: "1px solid #eee" }} />
                  ))
                : <div>No images yet.</div>}
            </div>
            {role === "dealer" && <ImageUploader vin={v.vin} onAdded={addImage} />}

            <h3 style={{ marginTop: 16 }}>History</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {["all", "maintenance", "accident", "ownership"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #ccc",
                    background: tab === t ? "#eee" : "#fff",
                    borderRadius: 6,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            <div>
              {hist.length
                ? hist.map((e, i) => (
                    <div key={i} style={{ fontSize: 14, marginBottom: 6 }}>
                      {new Date(e.created_at).toLocaleString()} • {e.type}
                    </div>
                  ))
                : <div>None</div>}
            </div>

            <h3 style={{ marginTop: 16 }}>Inspection</h3>
            {data.inspection ? (
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                <div>Tires lf {data.inspection.tires?.lf ?? "—"} rf {data.inspection.tires?.rf ?? "—"} lr {data.inspection.tires?.lr ?? "—"} rr {data.inspection.tires?.rr ?? "—"}</div>
                <div>Brakes front {data.inspection.brakes?.front ?? "—"} rear {data.inspection.brakes?.rear ?? "—"}</div>
                <div>Inspector {data.inspection.inspector || "—"}</div>
                <div>{data.inspection.notes || ""}</div>
              </div>
            ) : (
              <div>None</div>
            )}
            {role === "dealer" && (
              <form onSubmit={saveInspection} style={{ marginTop: 8, display: "grid", gap: 6, maxWidth: 420 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                  <input name="t_lf" placeholder="Tire LF 32nds" />
                  <input name="t_rf" placeholder="Tire RF 32nds" />
                  <input name="t_lr" placeholder="Tire LR 32nds" />
                  <input name="t_rr" placeholder="Tire RR 32nds" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 6 }}>
                  <input name="b_front" placeholder="Brake F %" />
                  <input name="b_rear" placeholder="Brake R %" />
                </div>
                <input name="inspector" placeholder="Inspector" />
                <textarea name="notes" rows={3} placeholder="Notes" />
                <button>Save inspection</button>
              </form>
            )}
          </div>

          <aside>
            <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Market pricing</div>
              {data.metrics ? (
                <div>
                  <div>Average {data.metrics.avg_price ? `$${Number(data.metrics.avg_price).toLocaleString()}` : "—"}</div>
                  <div>Listings {data.metrics.listings}</div>
                </div>
              ) : (
                <div>—</div>
              )}
            </div>

            <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Lien</div>
              {data.lien ? (
                <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                  <div>Lender {data.lien.lender || "—"}</div>
                  <div>Title with {data.lien.title_with || "—"}</div>
                  <div>Payoff {data.lien.payoff_cents != null ? `$${(Number(data.lien.payoff_cents) / 100).toLocaleString()}` : "—"}</div>
                  <div>Per diem {data.lien.per_diem_cents != null ? `$${(Number(data.lien.per_diem_cents) / 100).toLocaleString()}` : "—"}</div>
                  <div>10-day {data.lien.payoff_10day_cents != null ? `$${(Number(data.lien.payoff_10day_cents) / 100).toLocaleString()}` : "—"}</div>
                </div>
              ) : (
                <div>None</div>
              )}
              {role === "dealer" && (
                <form onSubmit={saveLien} style={{ marginTop: 8, display: "grid", gap: 6 }}>
                  <input name="lender" placeholder="Lender" defaultValue={data.lien?.lender || ""} />
                  <input name="title_with" placeholder="Title with" defaultValue={data.lien?.title_with || ""} />
                  <input name="payoff" placeholder="Same-day payoff $" defaultValue={data.lien?.payoff_cents ? (Number(data.lien.payoff_cents) / 100).toString() : ""} />
                  <input name="per_diem" placeholder="Per-diem $" defaultValue={data.lien?.per_diem_cents ? (Number(data.lien.per_diem_cents) / 100).toString() : ""} />
                  <input name="payoff10" placeholder="10-day payoff $" defaultValue={data.lien?.payoff_10day_cents ? (Number(data.lien.payoff_10day_cents) / 100).toString() : ""} />
                  <button>Save lien</button>
                </form>
              )}
            </div>

            <div style={{ fontSize: 12, color: "#555", marginTop: 12 }}>
              Anchor status {data.anchor?.status || "pending"}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
