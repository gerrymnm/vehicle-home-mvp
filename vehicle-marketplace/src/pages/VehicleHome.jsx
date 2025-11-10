// src/pages/VehicleHome.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  getVehicle,
  calculateShipping,
} from "../lib/api.js";
import ContactDealerModal from "../components/ContactDealerModal.jsx";

const wrap = { maxWidth: 1040, margin: "24px auto", padding: "0 16px" };
const title = { fontSize: 24, fontWeight: 700, margin: "0 0 16px" };
const err = { color: "crimson", marginTop: 12 };

export default function VehicleHome() {
  const { vin } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState(null);
  const [error, setError] = useState("");

  const [contactOpen, setContactOpen] = useState(false);
  const [distance, setDistance] = useState("");
  const [shipping, setShipping] = useState(null);

  useEffect(() => {
    let on = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getVehicle(vin);
        if (on) {
          setVehicle(res.vehicle);
        }
      } catch (e) {
        if (on) {
          setError(e.message || "Not found");
          setVehicle(null);
        }
      } finally {
        if (on) setLoading(false);
      }
    })();
    return () => {
      on = false;
    };
  }, [vin]);

  const onCalcShipping = () => {
    const fee = calculateShipping(distance);
    if (!fee) {
      setShipping(null);
      alert("Enter a valid distance in miles.");
      return;
    }
    setShipping(fee);
  };

  const onBuyOnline = () => {
    if (!shipping) {
      onCalcShipping();
      return;
    }
    alert(
      `Demo only.\nVehicle total with shipping: $${formatMoney(
        (vehicle.totalWithFees || vehicle.price) + shipping
      )}`
    );
  };

  return (
    <div style={wrap}>
      <p style={{ fontSize: 12, margin: "0 0 16px" }}>
        ← <Link to="/search">Back to search</Link>
      </p>

      {loading && <p>Loading…</p>}
      {!loading && error && <p style={err}>Error: {error}</p>}
      {!loading && !error && vehicle && (
        <>
          <h1 style={title}>
            {vehicle.year} {vehicle.make} {vehicle.model}
            {vehicle.trim ? ` ${vehicle.trim}` : ""}
          </h1>

          {/* Dealer info prominently under images */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 3fr) minmax(260px, 1.7fr)",
              gap: 24,
              alignItems: "flex-start",
            }}
          >
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    vehicle.images && vehicle.images.length > 1
                      ? "2fr 1fr"
                      : "1fr",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    height: 260,
                    borderRadius: 10,
                    overflow: "hidden",
                    background: "#f3f4f6",
                  }}
                >
                  {vehicle.images?.[0] && (
                    <img
                      src={vehicle.images[0]}
                      alt="Primary"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  )}
                </div>
                {vehicle.images?.[1] && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        borderRadius: 10,
                        overflow: "hidden",
                        background: "#f9fafb",
                      }}
                    >
                      <img
                        src={vehicle.images[1]}
                        alt="Alt view"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "#f9fafb",
                  marginBottom: 16,
                  fontSize: 13,
                }}
              >
                <div style={{ fontWeight: 700 }}>
                  {vehicle.dealer?.name || "Dealer Name"}
                </div>
                <div style={{ color: "#4b5563" }}>
                  {vehicle.dealer?.address || "Dealer address"}
                </div>
                {vehicle.dealer?.phone && (
                  <div style={{ color: "#111827", marginTop: 4 }}>
                    {vehicle.dealer.phone}
                  </div>
                )}
              </div>

              <section>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    margin: "0 0 6px",
                  }}
                >
                  Vehicle details
                </h3>
                <p style={{ margin: "0 0 4px", fontSize: 13 }}>
                  VIN: {vehicle.vin}
                </p>
                <p style={{ margin: "0 0 4px", fontSize: 13 }}>
                  {vehicle.mileage != null
                    ? `${formatNumber(vehicle.mileage)} miles`
                    : "Mileage N/A"}{" "}
                  • {vehicle.location}
                </p>
                {vehicle.description && (
                  <p
                    style={{
                      margin: "8px 0 0",
                      fontSize: 13,
                      color: "#4b5563",
                      lineHeight: 1.5,
                    }}
                  >
                    {vehicle.description}
                  </p>
                )}
              </section>

              <section style={{ marginTop: 18 }}>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    margin: "0 0 4px",
                  }}
                >
                  Vehicle history (sample)
                </h3>
                {vehicle.history ? (
                  <ul
                    style={{
                      paddingLeft: 16,
                      margin: 0,
                      fontSize: 13,
                      color: "#4b5563",
                    }}
                  >
                    <li>Owners: {vehicle.history.owners}</li>
                    <li>Accidents reported: {vehicle.history.accidents}</li>
                    <li>Usage: {vehicle.history.usage}</li>
                    {vehicle.history.highlights?.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                ) : (
                  <p style={{ fontSize: 13, color: "#6b7280" }}>
                    History report not attached (demo).
                  </p>
                )}
              </section>
            </div>

            {/* Right column: pricing + CTAs */}
            <aside
              style={{
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                position: "sticky",
                top: 16,
                background: "#fff",
              }}
            >
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Pricing breakdown
              </h3>
              <table
                style={{
                  width: "100%",
                  fontSize: 13,
                  borderCollapse: "collapse",
                }}
              >
                <tbody>
                  <tr>
                    <td>Vehicle price</td>
                    <td style={{ textAlign: "right", fontWeight: 600 }}>
                      ${formatMoney(vehicle.price)}
                    </td>
                  </tr>
                  {vehicle.fees?.map((f, i) => (
                    <tr key={i}>
                      <td>{f.label}</td>
                      <td style={{ textAlign: "right" }}>
                        {typeof f.amount === "number"
                          ? `+$${formatMoney(f.amount)}`
                          : "+ added by dealer"}
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td
                      style={{
                        paddingTop: 4,
                        borderTop: "1px solid #e5e7eb",
                        fontWeight: 600,
                      }}
                    >
                      Subtotal w/ add-ons
                    </td>
                    <td
                      style={{
                        paddingTop: 4,
                        borderTop: "1px solid #e5e7eb",
                        textAlign: "right",
                        fontWeight: 700,
                      }}
                    >
                      $
                      {formatMoney(
                        vehicle.totalWithFees || vehicle.price
                      )}
                    </td>
                  </tr>
                  {shipping != null && (
                    <>
                      <tr>
                        <td>Shipping (Buy Online)</td>
                        <td style={{ textAlign: "right" }}>
                          +${formatMoney(shipping)}
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{
                            paddingTop: 4,
                            borderTop: "1px solid #e5e7eb",
                            fontWeight: 700,
                          }}
                        >
                          Total delivered
                        </td>
                        <td
                          style={{
                            paddingTop: 4,
                            borderTop: "1px solid #e5e7eb",
                            textAlign: "right",
                            fontWeight: 800,
                          }}
                        >
                          $
                          {formatMoney(
                            (vehicle.totalWithFees || vehicle.price) +
                              shipping
                          )}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>

              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <button
                  onClick={() => setContactOpen(true)}
                  style={btnPrimary}
                >
                  CONTACT DEALER
                </button>
                <button
                  onClick={() => nav("/credit-application")}
                  style={btnSecondary}
                >
                  GET APPROVED
                </button>
                <div
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    background: "#f9fafb",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    Buy online
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                    }}
                  >
                    Enter your estimated distance from the dealership to
                    preview delivered pricing.
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="number"
                      min="1"
                      placeholder="Distance (miles)"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        borderRadius: 6,
                        border: "1px solid #d1d5db",
                        fontSize: 12,
                      }}
                    />
                    <button
                      type="button"
                      onClick={onCalcShipping}
                      style={{
                        padding: "6px 10px",
                        borderRadius: 6,
                        border: "1px solid #111827",
                        background: "#fff",
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      Calc
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={onBuyOnline}
                    style={btnPrimarySm}
                  >
                    BUY ONLINE (DEMO)
                  </button>
                </div>
              </div>
            </aside>
          </div>

          <ContactDealerModal
            open={contactOpen}
            onClose={() => setContactOpen(false)}
            dealer={vehicle.dealer}
          />
        </>
      )}
    </div>
  );
}

function formatMoney(n) {
  return Number(n || 0).toLocaleString();
}
function formatNumber(n) {
  return Number(n || 0).toLocaleString();
}

const btnPrimary = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "none",
  background: "#111827",
  color: "#fff",
  fontWeight: 700,
  fontSize: 12,
  cursor: "pointer",
};
const btnPrimarySm = {
  ...btnPrimary,
  padding: "7px 10px",
  fontSize: 11,
};
const btnSecondary = {
  padding: "9px 14px",
  borderRadius: 8,
  border: "1px solid #111827",
  background: "#fff",
  color: "#111827",
  fontWeight: 600,
  fontSize: 12,
  cursor: "pointer",
};
