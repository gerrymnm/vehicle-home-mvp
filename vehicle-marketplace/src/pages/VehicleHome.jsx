// vehicle-marketplace/src/pages/VehicleHome.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getVehicle, calculateShipping } from "../lib/api.js";
import ContactDealerModal from "../components/ContactDealerModal.jsx";

const wrap = {
  maxWidth: 1120,
  margin: "24px auto",
  padding: "0 16px 40px",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

const layout = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 3fr) minmax(260px, 1.6fr)",
  gap: "24px",
  alignItems: "flex-start",
};

const gallery = { display: "flex", flexDirection: "column", gap: "8px" };

const mainImg = {
  width: "100%",
  borderRadius: "10px",
  objectFit: "cover",
  maxHeight: "380px",
};

const thumbRow = {
  display: "flex",
  gap: "6px",
  overflowX: "auto",
};

const thumb = (active) => ({
  width: 70,
  height: 52,
  objectFit: "cover",
  borderRadius: "6px",
  border: active ? "2px solid #2563eb" : "1px solid #e5e7eb",
  cursor: "pointer",
  flexShrink: 0,
});

const dealerBox = {
  padding: "14px 16px",
  borderRadius: "10px",
  border: "1px solid #e5e7eb",
  marginTop: "10px",
  background: "#f9fafb",
  fontSize: "13px",
};

const priceBox = {
  padding: "18px 16px",
  borderRadius: "12px",
  border: "1px solid #e5e7eb",
  boxShadow: "0 4px 18px rgba(15,23,42,0.06)",
  background: "#ffffff",
};

const ctas = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  marginTop: "14px",
};

const primaryBtn = {
  padding: "11px 10px",
  borderRadius: "999px",
  border: "none",
  background: "#111827",
  color: "#ffffff",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "14px",
  width: "100%",
};

const ghostBtn = {
  ...primaryBtn,
  background: "#ffffff",
  color: "#111827",
  border: "1px solid #d1d5db",
};

const subtle = {
  fontSize: "11px",
  color: "#6b7280",
  marginTop: "4px",
};

const pill = {
  display: "inline-block",
  padding: "4px 9px",
  borderRadius: "999px",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontSize: "11px",
  fontWeight: 500,
  marginRight: "6px",
};

const feeRow = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "11px",
  color: "#4b5563",
};

const totalRow = {
  ...feeRow,
  fontWeight: 600,
  marginTop: "6px",
  borderTop: "1px solid #e5e7eb",
  paddingTop: "6px",
};

const sectionTitle = {
  fontSize: "15px",
  fontWeight: 600,
  margin: "14px 0 4px",
};

const bulletList = {
  margin: "0",
  paddingLeft: "16px",
  fontSize: "12px",
  color: "#4b5563",
};

// Payment calculator constants (demo)
const TERMS = [24, 36, 48, 60, 72, 84];
const DEFAULT_TERM = 72;
const MIN_LOAN = 5000;
const APR = 0.075; // 7.5% APR demo

// --- Helper: build out-the-door cost estimate from ZIP (demo logic) ---
function buildCostBreakdown({ vehicle, zip }) {
  if (!vehicle || !zip || zip.length < 5) return null;

  const fees = vehicle.fees || [];
  const feesTotal = fees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  // Use detected doc fee if present; else assume $85 for demo.
  const docFromFees =
    fees.find((f) => /doc/i.test(f.label || ""))?.amount ?? null;
  const docFee = Number(docFromFees) || 85;

  const baseWithFees = vehicle.price + feesTotal;

  // Very rough demo tax logic:
  const taxRate = zip.startsWith("9") ? 0.09 : 0.07;
  const tax = Math.round(baseWithFees * taxRate);

  // Simple flat DMV estimate for demo.
  const dmv = baseWithFees > 20000 ? 420 : 320;

  const total = baseWithFees + tax + dmv + docFee;

  return {
    zip,
    taxRate,
    baseWithFees,
    docFee,
    tax,
    dmv,
    total,
  };
}

// --- Helper: monthly payment from principal / term ---
function calcMonthly(principal, termMonths, apr = APR) {
  if (!principal || principal <= 0 || !termMonths) return 0;
  const r = apr / 12;
  if (r === 0) return principal / termMonths;
  const m = principal * (r / (1 - Math.pow(1 + r, -termMonths)));
  return m;
}

export default function VehicleHome() {
  const { vin } = useParams();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [contactOpen, setContactOpen] = useState(false);

  const [miles, setMiles] = useState("");
  const [shipping, setShipping] = useState(0);

  const [zip, setZip] = useState("");
  const [breakdown, setBreakdown] = useState(null);
  const [autoLocated, setAutoLocated] = useState(false);

  const [term, setTerm] = useState(DEFAULT_TERM);
  const [downPayment, setDownPayment] = useState(0);
  const [monthly, setMonthly] = useState(0);

  // Load vehicle
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr("");
    getVehicle(vin)
      .then((res) => {
        if (cancelled) return;
        setVehicle(res.vehicle);
        setPhotoIndex(0);
      })
      .catch((e) => {
        if (cancelled) return;
        setErr(e.message || "Vehicle not found");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [vin]);

  // Auto-attempt location once (demo behavior)
  useEffect(() => {
    if (autoLocated || zip) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      () => {
        // For demo, assume local ZIP; no external geocoding.
        setZip("94103");
        setAutoLocated(true);
      },
      () => {
        // ignore errors silently
      },
      { timeout: 2000 }
    );
  }, [autoLocated, zip]);

  // Recompute breakdown when zip or vehicle changes
  useEffect(() => {
    if (!vehicle) return;
    const next = buildCostBreakdown({ vehicle, zip });
    setBreakdown(next);
  }, [zip, vehicle]);

  // When miles input changes, recalc shipping
  const onMilesChange = (e) => {
    const value = e.target.value.replace(/[^\d]/g, "");
    setMiles(value);
    const dist = Number(value || 0);
    setShipping(calculateShipping(dist));
  };

  // Effective totals
  const baseTotal =
    breakdown?.total ??
    vehicle?.totalWithFees ??
    vehicle?.price ??
    0;

  const effectiveTotal = baseTotal + (shipping > 0 ? shipping : 0);

  // Compute default down payment + monthly whenever total or term changes
  useEffect(() => {
    if (!effectiveTotal || effectiveTotal <= 0) return;

    // Suggested = 10% of total, rounded up to nearest 1,000
    let suggested =
      Math.ceil((effectiveTotal * 0.1) / 1000) * 1000;

    // Ensure loan >= MIN_LOAN
    const maxAllowedDown = Math.max(
      0,
      effectiveTotal - MIN_LOAN
    );
    if (suggested > maxAllowedDown) {
      suggested = maxAllowedDown;
    }
    if (suggested < 0) suggested = 0;

    // If current downPayment is 0 (initial) or out of range, reset to suggested
    setDownPayment((prev) => {
      if (prev <= 0 || prev > maxAllowedDown) return suggested;
      return prev;
    });
  }, [effectiveTotal]);

  // Recalculate monthly whenever inputs change
  useEffect(() => {
    if (!effectiveTotal || effectiveTotal <= 0) {
      setMonthly(0);
      return;
    }

    const maxAllowedDown = Math.max(
      0,
      effectiveTotal - MIN_LOAN
    );

    let dp = Number(downPayment) || 0;
    if (dp < 0) dp = 0;
    if (dp > maxAllowedDown) dp = maxAllowedDown;

    if (dp !== downPayment) {
      setDownPayment(dp);
      return; // next effect run will compute with clamped value
    }

    const principal = effectiveTotal - dp;
    if (principal < MIN_LOAN) {
      setMonthly(0);
      return;
    }

    const t = TERMS.includes(Number(term))
      ? Number(term)
      : DEFAULT_TERM;
    if (t !== term) {
      setTerm(t);
      return;
    }

    const m = calcMonthly(principal, t, APR);
    setMonthly(Math.round(m));
  }, [effectiveTotal, downPayment, term]);

  const onGetApproved = () => {
    if (!vehicle) return;
    navigate("/apply", { state: { vin: vehicle.vin, vehicle } });
  };

  const onBuyOnline = () => {
    const input = document.getElementById("shipping-miles-input");
    if (input) {
      input.scrollIntoView({ behavior: "smooth", block: "center" });
      input.focus();
    }
  };

  if (loading) {
    return (
      <div style={wrap}>
        <p>Loading vehicle...</p>
      </div>
    );
  }

  if (err || !vehicle) {
    return (
      <div style={wrap}>
        <p style={{ color: "crimson" }}>{err || "Vehicle not found."}</p>
      </div>
    );
  }

  const photos =
    vehicle.photos && vehicle.photos.length
      ? vehicle.photos
      : [
          "https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&w=900",
        ];

  const fees = vehicle.fees || [];
  const totalWithFees =
    vehicle.totalWithFees || vehicle.price;

  return (
    <div style={wrap}>
      <div style={{ marginBottom: "10px", fontSize: "11px", color: "#6b7280" }}>
        {vehicle.year} {vehicle.make} {vehicle.model}
        {vehicle.trim ? ` ${vehicle.trim}` : ""} • VIN {vehicle.vin}
      </div>

      <div style={layout}>
        {/* LEFT: MEDIA + DETAILS */}
        <div>
          <div style={gallery}>
            <img
              src={
                photos[
                  Math.max(
                    0,
                    Math.min(photoIndex, photos.length - 1)
                  )
                ]
              }
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              style={mainImg}
            />
            {photos.length > 1 && (
              <div style={thumbRow}>
                {photos.map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt=""
                    style={thumb(idx === photoIndex)}
                    onClick={() => setPhotoIndex(idx)}
                  />
                ))}
              </div>
            )}
          </div>

          <div style={dealerBox}>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>
              Selling dealer
            </div>
            <div style={{ fontSize: "15px", fontWeight: 600 }}>
              {vehicle.dealer?.name || "Partner Dealer"}
            </div>
            <div>
              {vehicle.dealer?.address && (
                <>
                  {vehicle.dealer.address}
                  <br />
                </>
              )}
              {(vehicle.dealer?.city ||
                vehicle.dealer?.state ||
                vehicle.dealer?.zip) && (
                <>
                  {vehicle.dealer?.city}, {vehicle.dealer?.state}{" "}
                  {vehicle.dealer?.zip}
                  <br />
                </>
              )}
              {vehicle.dealer?.phone && <span>{vehicle.dealer.phone}</span>}
            </div>
          </div>

          <div style={{ marginTop: "18px" }}>
            <div style={sectionTitle}>Highlights</div>
            <ul style={bulletList}>
              <li>
                {vehicle.year} {vehicle.make} {vehicle.model}
                {vehicle.trim ? ` ${vehicle.trim}` : ""} •{" "}
                {vehicle.mileage?.toLocaleString()} miles •{" "}
                {vehicle.condition}
              </li>
              {vehicle.bodyStyle && <li>{vehicle.bodyStyle}</li>}
              {vehicle.drivetrain && <li>{vehicle.drivetrain}</li>}
              {vehicle.transmission && <li>{vehicle.transmission}</li>}
              {vehicle.fuelType && <li>{vehicle.fuelType}</li>}
              {vehicle.color && <li>Exterior: {vehicle.color}</li>}
            </ul>

            <div style={sectionTitle}>Vehicle description</div>
            <p
              style={{
                fontSize: "12px",
                color: "#4b5563",
                lineHeight: 1.6,
                whiteSpace: "pre-line",
              }}
            >
              {vehicle.description ||
                "Dealer-supplied description coming soon."}
            </p>
          </div>
        </div>

        {/* RIGHT: PRICE + CTAS */}
        <aside style={priceBox}>
          {/* Base price */}
          <div style={{ fontSize: "11px", color: "#6b7280" }}>
            Advertised price
          </div>
          <div style={{ fontSize: "26px", fontWeight: 700 }}>
            ${vehicle.price.toLocaleString()}
          </div>
          <div style={subtle}>
            Price set by dealer. Taxes, DMV fees, and government charges not
            included.
          </div>

          {/* ZIP input */}
          <div style={{ marginTop: "8px" }}>
            <div
              style={{
                fontSize: "11px",
                color: "#4b5563",
                marginBottom: 3,
              }}
            >
              Enter your ZIP to estimate total cost
            </div>
            <input
              value={zip}
              onChange={(e) =>
                setZip(
                  e.target.value.replace(/[^\d]/g, "").slice(0, 5)
                )
              }
              placeholder="e.g. 94103"
              maxLength={5}
              style={{
                width: "100%",
                padding: "7px 9px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                fontSize: 12,
              }}
            />
            {autoLocated && (
              <div style={{ ...subtle, fontSize: 10 }}>
                Using your device location (demo) to pre-fill ZIP.
              </div>
            )}
          </div>

          {/* Dealer add-ons */}
          {fees.length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <div style={sectionTitle}>Detected dealer add-ons</div>
              {fees.map((f, i) => (
                <div key={i} style={feeRow}>
                  <span>{f.label}</span>
                  <span>+${Number(f.amount).toLocaleString()}</span>
                </div>
              ))}
              <div style={totalRow}>
                <span>Price with dealer add-ons</span>
                <span>${totalWithFees.toLocaleString()}</span>
              </div>
              <div style={subtle}>
                Based on listing text. You can remove unwanted add-ons during
                deal review.
              </div>
            </div>
          )}

          {/* Out-the-door breakdown (no shipping yet) */}
          {breakdown && (
            <div style={{ marginTop: "12px" }}>
              <div style={sectionTitle}>Estimated out-the-door</div>
              <div style={feeRow}>
                <span>
                  Vehicle price + add-ons
                  <span style={{ color: "#9ca3af" }}>
                    {" "}
                    (ZIP {breakdown.zip})
                  </span>
                </span>
                <span>${breakdown.baseWithFees.toLocaleString()}</span>
              </div>
              <div style={feeRow}>
                <span>
                  Taxes (~{Math.round(breakdown.taxRate * 100)}%)
                </span>
                <span>${breakdown.tax.toLocaleString()}</span>
              </div>
              <div style={feeRow}>
                <span>DMV fees (est.)</span>
                <span>${breakdown.dmv.toLocaleString()}</span>
              </div>
              <div style={feeRow}>
                <span>Dealer documentation fee</span>
                <span>${breakdown.docFee.toLocaleString()}</span>
              </div>
              <div style={totalRow}>
                <span>Estimated total (no shipping)</span>
                <span>${breakdown.total.toLocaleString()}</span>
              </div>
              <div style={{ ...subtle, marginTop: 2 }}>
                Demo estimate only. Actual tax/DMV/doc fees depend on your
                registration address and dealer terms.
              </div>
            </div>
          )}

          {/* Shipping estimator */}
          <div id="shipping-section" style={{ marginTop: "16px" }}>
            <div style={sectionTitle}>Estimate shipping</div>
            <div
              style={{
                fontSize: "11px",
                color: "#6b7280",
                marginBottom: 4,
              }}
            >
              $250 flat within 100 miles, then $2 per mile after that.
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
                id="shipping-miles-input"
                type="text"
                inputMode="numeric"
                value={miles}
                onChange={onMilesChange}
                placeholder="Distance in miles"
                style={{
                  flex: 1,
                  padding: "7px 9px",
                  borderRadius: "8px",
                  border: "1px solid #d1d5db",
                  fontSize: "12px",
                }}
              />
            </div>
            <div
              style={{
                marginTop: 6,
                fontSize: "12px",
                color: "#111827",
              }}
            >
              Shipping:{" "}
              <strong>
                {shipping > 0
                  ? `$${shipping.toLocaleString()}`
                  : "--"}
              </strong>
            </div>
            {shipping > 0 && (
              <div style={{ fontSize: "11px", color: "#6b7280" }}>
                Shipping is included in the total estimate below.
              </div>
            )}
          </div>

          {/* Combined total incl. shipping (if any) */}
          {effectiveTotal > 0 && (
            <div style={{ marginTop: "14px" }}>
              <div style={sectionTitle}>
                Estimated total with shipping
              </div>
              <div style={totalRow}>
                <span>Total (vehicle, fees, est. tax/DMV/doc, shipping)</span>
                <span>${effectiveTotal.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Monthly payment calculator */}
          {effectiveTotal > 0 && (
            <div style={{ marginTop: "14px" }}>
              <div style={sectionTitle}>
                <span role="img" aria-label="calculator">
                  🧮
                </span>{" "}
                Estimate monthly payment
              </div>

              {/* Down payment */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 4,
                  fontSize: 11,
                }}
              >
                <span style={{ width: 78 }}>Down payment</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={
                    downPayment
                      ? downPayment.toLocaleString()
                      : ""
                  }
                  onChange={(e) => {
                    const raw = e.target.value
                      .replace(/[^\d]/g, "");
                    const num = Number(raw || 0);
                    setDownPayment(num);
                  }}
                  placeholder="e.g. 3,000"
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 11,
                  }}
                />
              </div>

              {/* Term selector */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 6,
                  fontSize: 11,
                }}
              >
                <span style={{ width: 78 }}>Term</span>
                <select
                  value={term}
                  onChange={(e) =>
                    setTerm(Number(e.target.value))
                  }
                  style={{
                    flex: 1,
                    padding: "6px 8px",
                    borderRadius: 8,
                    border: "1px solid #d1d5db",
                    fontSize: 11,
                  }}
                >
                  {TERMS.map((t) => (
                    <option key={t} value={t}>
                      {t} months
                    </option>
                  ))}
                </select>
              </div>

              {/* Monthly result */}
              <div style={{ marginTop: 8 }}>
                {monthly > 0 ? (
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    Approx.{" "}
                    <span>
                      ${monthly.toLocaleString()}
                    </span>{" "}
                    / month
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                    }}
                  >
                    Adjust down payment and term to keep loan
                    amount at least ${MIN_LOAN.toLocaleString()}.
                  </div>
                )}
                <div
                  style={{
                    ...subtle,
                    fontSize: 9,
                    marginTop: 2,
                  }}
                >
                  For illustration only. Assumes {(
                    APR * 100
                  ).toFixed(1)}
                  % APR, simple interest, and average
                  credit. Actual terms from lenders may
                  differ.
                </div>
              </div>
            </div>
          )}

          <div style={{ marginTop: "14px" }}>
            <span style={pill}>Transparent fees</span>
            <span style={pill}>Online ready</span>
            <span style={pill}>Ship to your door</span>
          </div>

          <div style={ctas}>
            <button
              style={primaryBtn}
              onClick={() => setContactOpen(true)}
            >
              CONTACT DEALER
            </button>
            <button style={ghostBtn} onClick={onGetApproved}>
              GET APPROVED
            </button>
            <button style={ghostBtn} onClick={onBuyOnline}>
              BUY ONLINE (ESTIMATE)
            </button>
          </div>

          <div style={subtle}>
            This is a demo marketplace using sample data for
            illustration only.
          </div>
        </aside>
      </div>

      {contactOpen && (
        <ContactDealerModal
          vehicle={vehicle}
          dealer={vehicle.dealer}
          onClose={() => setContactOpen(false)}
        />
      )}
    </div>
  );
}
