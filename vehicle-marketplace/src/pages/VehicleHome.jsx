// vehicle-marketplace/src/pages/VehicleHome.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getVehicle,
  analyzeFees,
  computeTotalWithFees,
  calculateShipping,
  getVehicleHistory,
} from "../lib/api.js";
import ContactDealerModal from "../components/ContactDealerModal.jsx"; // you already have this
import PrequalModal from "../components/PrequalModal.jsx"; // simple loan/credit modal

const pageWrap = { maxWidth: 1180, margin: "16px auto", padding: "0 16px" };
const grid = { display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24 };
const h1 = { fontSize: 14, fontWeight: 700, margin: "12px 0", letterSpacing: 0.2 };
const price = { fontSize: 28, fontWeight: 800, margin: 0 };
const card = {
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: 16,
  background: "#fff",
};

function formatMoney(v) {
  if (v == null || Number.isNaN(Number(v))) return "--";
  return Number(v).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function calcDefaultDown(total) {
  if (!total || total <= 0) return 0;
  let down = Math.ceil((total * 0.1) / 1000) * 1000;
  if (total - down < 5000) down = Math.max(0, total - 5000);
  return down;
}

function calcMonthly(total, down, termMonths, apr = 0.075) {
  if (!total || termMonths <= 0) return null;
  const loan = Math.max(total - (down || 0), 0);
  if (loan <= 0) return 0;
  const r = apr / 12;
  const pow = Math.pow(1 + r, termMonths);
  return (loan * r * pow) / (pow - 1);
}

export default function VehicleHome() {
  const { vin } = useParams();

  const [vehicle, setVehicle] = useState(null);
  const [fees, setFees] = useState(null);
  const [zip, setZip] = useState("");
  const [distance, setDistance] = useState(""); // miles for shipping
  const [history, setHistory] = useState(null);

  const [showContact, setShowContact] = useState(false);
  const [showPrequal, setShowPrequal] = useState(false);

  const [term, setTerm] = useState(72);
  const [down, setDown] = useState(0);

  const [histTab, setHistTab] = useState("ALL");

  useEffect(() => {
    (async () => {
      const v = await getVehicle(vin);
      if (v.ok && v.vehicle) {
        setVehicle(v.vehicle);
        const parsed = analyzeFees(v.vehicle.description || "");
        setFees(parsed);
      }
      const hv = await getVehicleHistory(vin);
      if (hv.ok) setHistory(hv.history);
    })();
  }, [vin]);

  const shipping = useMemo(() => calculateShipping(distance), [distance]);

  const totals = useMemo(() => {
    const p = Number(vehicle?.price || 0);
    return computeTotalWithFees(p, { ...(fees || {}), shipping });
  }, [vehicle, fees, shipping]);

  useEffect(() => {
    setDown(calcDefaultDown(totals?.total || 0));
  }, [totals?.total]);

  const monthly = useMemo(() => {
    return calcMonthly(totals?.total || 0, down, term);
  }, [totals?.total, down, term]);

  if (!vehicle) {
    return (
      <div style={pageWrap}>
        <p>Loading…</p>
      </div>
    );
  }

  const photos = vehicle.photos && vehicle.photos.length ? vehicle.photos : [
    "https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&w=1200",
  ];

  return (
    <div style={pageWrap}>
      <div style={{ marginBottom: 8 }}>
        <a href="/" style={{ fontSize: 12, color: "#2563eb", textDecoration: "none" }}>
          Vehicle Marketplace
        </a>
        {"  "}
        <a href="/search" style={{ fontSize: 12, color: "#2563eb", textDecoration: "none", marginLeft: 10 }}>
          Search
        </a>
      </div>

      <div style={grid}>
        {/* LEFT: Gallery + details */}
        <div>
          {/* Hero photo */}
          <div
            style={{
              ...card,
              padding: 0,
              overflow: "hidden",
            }}
          >
            <img
              src={photos[0]}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              style={{ width: "100%", height: 380, objectFit: "cover" }}
            />
            {photos.length > 1 && (
              <div style={{ display: "flex", gap: 8, padding: 8 }}>
                {photos.slice(1, 4).map((p, i) => (
                  <div
                    key={i}
                    style={{
                      width: 96,
                      height: 60,
                      borderRadius: 8,
                      background: `url('${p}') center/cover no-repeat`,
                      border: "1px solid #eee",
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Dealer block */}
          <div style={{ ...card, marginTop: 12 }}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>{vehicle.dealerName}</div>
            <div style={{ fontSize: 13, color: "#6b7280" }}>{vehicle.dealerAddress}</div>
            {vehicle.dealerPhone && (
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>{vehicle.dealerPhone}</div>
            )}
          </div>

          {/* Highlights */}
          <div style={{ ...card, marginTop: 12 }}>
            <div style={h1}>Highlights</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
              {(vehicle.highlights || []).map((h, i) => (
                <li key={i}>{h}</li>
              ))}
            </ul>
          </div>

          {/* Description */}
          <div style={{ ...card, marginTop: 12 }}>
            <div style={h1}>Vehicle description</div>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>{vehicle.description}</div>
          </div>

          {/* CARFAX HISTORY */}
          <div style={{ ...card, marginTop: 12 }}>
            <div style={{ ...h1, fontSize: 16 }}>CARFAX HISTORY</div>

            {/* Ribbon */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              {["ALL", "OWNERS", "MAINTENANCE", "EVENTS", "SMOG", "INSPECTION"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setHistTab(tab)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 999,
                    border: "1px solid #d1d5db",
                    background: histTab === tab ? "#111827" : "#fff",
                    color: histTab === tab ? "#fff" : "#111827",
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content */}
            {!history ? (
              <div style={{ fontSize: 13, color: "#6b7280" }}>Loading history…</div>
            ) : (
              <HistoryPanel tab={histTab} history={history} />
            )}

            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 10 }}>
              Data provided by CARFAX® via API. For demo, this is sample content. Actual records vary by VIN.
            </div>
          </div>
        </div>

        {/* RIGHT: Price/fees/shipping/payment */}
        <div>
          <div style={card}>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Advertised price</div>
            <h2 style={price}>{formatMoney(vehicle.price)}</h2>
            <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 8 }}>
              Price set by dealer. Taxes, DMV fees, and government charges not included.
            </div>

            {/* ZIP for taxes/fees preview (kept simple for demo) */}
            <div style={{ margin: "8px 0 10px" }}>
              <label style={{ fontSize: 12, color: "#6b7280", display: "block", marginBottom: 4 }}>
                Enter your ZIP to estimate total cost
              </label>
              <input
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="e.g. 94939"
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6 }}
              />
            </div>

            {/* Detected fees */}
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>Detected dealer add-ons</div>
            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 8px 0", fontSize: 12 }}>
              <LineItem label="Processing fee" value={fees?.processingFee} />
              <LineItem label="Reconditioning fee" value={fees?.reconFee} />
              {fees?.docFee ? <LineItem label="Dealer documentation fee" value={fees?.docFee} /> : null}
              {fees?.addons ? <LineItem label="Other add-ons" value={fees?.addons} /> : null}
            </ul>

            {/* Shipping input */}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Estimate shipping</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 6 }}>
                $250 flat within 100 miles, then $2 per mile after that.
              </div>
              <input
                value={distance}
                onChange={(e) => setDistance(e.target.value)}
                placeholder="Distance in miles"
                style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6 }}
              />
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>
                Shipping: {shipping ? formatMoney(shipping) : "--"}
              </div>
            </div>

            {/* Totals */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Estimated out-the-door</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, fontSize: 12 }}>
                <LineItem label="Vehicle price" value={totals?.price} />
                <LineItem label="Taxes (est.)" value={totals?.tax} />
                <LineItem label="DMV (est.)" value={totals?.dmvFee} />
                <LineItem label="Dealer fees (est.)" value={(totals?.docFee || 0) + (totals?.processingFee || 0) + (totals?.reconFee || 0) + (totals?.addons || 0)} />
                <LineItem label="Shipping (est.)" value={totals?.shipping} />
              </ul>
              <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div style={{ fontSize: 13, color: "#6b7280" }}>Estimated total with shipping</div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{formatMoney(totals?.total)}</div>
              </div>
            </div>

            {/* Monthly payment */}
            <div style={{ marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span role="img" aria-label="calculator">🧮</span>
                <div style={{ fontWeight: 700 }}>Estimated monthly payment</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Down payment</div>
                  <input
                    value={down}
                    onChange={(e) => setDown(Math.max(0, Number(e.target.value) || 0))}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6 }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Term</div>
                  <select
                    value={term}
                    onChange={(e) => setTerm(Number(e.target.value))}
                    style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6 }}
                  >
                    {[24, 36, 48, 60, 72, 84].map((m) => (
                      <option key={m} value={m}>
                        {m} months
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                Approx. <b>{formatMoney(monthly)}</b> / month
                <div style={{ fontSize: 11 }}>
                  For illustration only, assumes 7.5% APR, simple interest, and average credit. Actual terms from lenders may differ.
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
              <button
                onClick={() => setShowContact(true)}
                style={ctaPrimary}
              >
                CONTACT DEALER
              </button>
              <button
                onClick={() => setShowPrequal(true)}
                style={ctaOutline}
              >
                GET APPROVED
              </button>
              <button
                onClick={() => alert("Buy Online (estimate) — demo only")}
                style={ctaOutline}
              >
                BUY ONLINE (ESTIMATE)
              </button>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>
                This is a demo marketplace using sample data for illustration only.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showContact && (
        <ContactDealerModal
          onClose={() => setShowContact(false)}
          dealer={{
            name: vehicle.dealerName,
            phone: vehicle.dealerPhone,
            address: vehicle.dealerAddress,
          }}
          vehicle={{
            vin: vehicle.vin,
            title: `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? " " + vehicle.trim : ""}`,
          }}
        />
      )}
      {showPrequal && <PrequalModal onClose={() => setShowPrequal(false)} />}
    </div>
  );
}

function LineItem({ label, value }) {
  return (
    <li style={{ display: "flex", justifyContent: "space-between", margin: "3px 0" }}>
      <span style={{ color: "#6b7280" }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value != null ? formatMoney(value) : "--"}</span>
    </li>
  );
}

function HistoryPanel({ tab, history }) {
  const pill = {
    display: "inline-block",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#f3f4f6",
    marginRight: 8,
    fontSize: 12,
  };

  if (tab === "OWNERS") {
    return (
      <div>
        <div style={pill}>Owners: <b>{history.owners}</b></div>
        <p style={{ fontSize: 13, color: "#374151", marginTop: 8 }}>
          Number of prior owners (from CARFAX). Ownership history may affect warranty eligibility and service schedules.
        </p>
      </div>
    );
  }
  if (tab === "MAINTENANCE") {
    return (
      <div>
        <div style={pill}>Maintenance records: <b>{history.maintenance}</b></div>
        <ul style={{ marginTop: 8 }}>
          {history.all.filter((x) => x.type === "MAINTENANCE").map((e, i) => (
            <li key={i} style={{ fontSize: 13 }}>{e.date} — {e.text}</li>
          ))}
        </ul>
      </div>
    );
  }
  if (tab === "EVENTS") {
    return (
      <div>
        <div style={pill}>Events: <b>{history.events}</b></div>
        {history.events === 0 ? (
          <p style={{ fontSize: 13, marginTop: 8 }}>No incidents reported.</p>
        ) : (
          <ul style={{ marginTop: 8 }}>
            {history.all.filter((x) => x.type === "EVENT").map((e, i) => (
              <li key={i} style={{ fontSize: 13 }}>{e.date} — {e.text}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }
  if (tab === "SMOG") {
    return (
      <div>
        <div style={pill}>Smog: <b>{history.smog}</b></div>
        <ul style={{ marginTop: 8 }}>
          {history.all.filter((x) => x.type === "SMOG").map((e, i) => (
            <li key={i} style={{ fontSize: 13 }}>{e.date} — {e.text}</li>
          ))}
        </ul>
      </div>
    );
  }
  if (tab === "INSPECTION") {
    return (
      <div>
        <div style={pill}>Inspection status: <b>{history.inspection}</b></div>
        <ul style={{ marginTop: 8 }}>
          {history.all.filter((x) => x.type === "INSPECTION").map((e, i) => (
            <li key={i} style={{ fontSize: 13 }}>{e.date} — {e.text}</li>
          ))}
        </ul>
      </div>
    );
  }
  // ALL
  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <div style={pill}>Owners: <b>{history.owners}</b></div>
        <div style={pill}>Maintenance: <b>{history.maintenance}</b></div>
        <div style={pill}>Events: <b>{history.events}</b></div>
        <div style={pill}>Smog: <b>{history.smog}</b></div>
        <div style={pill}>Inspection: <b>{history.inspection}</b></div>
      </div>
      <ul style={{ marginTop: 10 }}>
        {history.all.map((e, i) => (
          <li key={i} style={{ fontSize: 13 }}>
            <b>{e.type}</b> — {e.date}: {e.text}
          </li>
        ))}
      </ul>
    </div>
  );
}

const ctaPrimary = {
  padding: "12px 14px",
  borderRadius: 999,
  background: "#111827",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  fontWeight: 700,
};

const ctaOutline = {
  padding: "12px 14px",
  borderRadius: 999,
  background: "#fff",
  color: "#111827",
  border: "1px solid #d1d5db",
  cursor: "pointer",
  fontWeight: 700,
};
