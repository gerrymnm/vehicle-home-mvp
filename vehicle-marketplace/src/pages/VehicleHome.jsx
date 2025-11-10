import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getVehicle,
  calculateShipping,
} from "../lib/api.js";
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

const gallery = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

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

  const onMilesChange = (e) => {
    const value = e.target.value.replace(/[^\d]/g, "");
    setMiles(value);
    const dist = Number(value || 0);
    setShipping(calculateShipping(dist));
  };

  const onGetApproved = () => {
    if (!vehicle) return;
    navigate("/apply", { state: { vin: vehicle.vin, vehicle } });
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

  const photos = vehicle.photos && vehicle.photos.length > 0
    ? vehicle.photos
    : [
        "https://images.pexels.com/photos/210019/pexels-photo-210019.jpeg?auto=compress&w=900",
      ];

  const fees = vehicle.fees || [];
  const totalWithFees = vehicle.totalWithFees || vehicle.price;

  return (
    <div style={wrap}>
      <div style={{ marginBottom: "10px", fontSize: "11px", color: "#6b7280" }}>
        {vehicle.year} {vehicle.make} {vehicle.model}
        {vehicle.trim ? ` ${vehicle.trim}` : ""} • VIN {vehicle.vin}
      </div>

      <div style={layout}>
        <div>
          <div style={gallery}>
            <img
              src={photos[Math.max(0, Math.min(photoIndex, photos.length - 1))]}
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
              {(vehicle.dealer?.city || vehicle.dealer?.state || vehicle.dealer?.zip) && (
                <>
                  {vehicle.dealer?.city}, {vehicle.dealer?.state}{" "}
                  {vehicle.dealer?.zip}
                  <br />
                </>
              )}
              {vehicle.dealer?.phone && (
                <span>{vehicle.dealer.phone}</span>
              )}
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

        <aside style={priceBox}>
          <div style={{ fontSize: "11px", color: "#6b7280" }}>Advertised price</div>
          <div style={{ fontSize: "26px", fontWeight: 700 }}>
            ${vehicle.price.toLocaleString()}
          </div>
          <div style={subtle}>
            Price set by dealer. Taxes, DMV fees, and government charges not included.
          </div>

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
                Based on listing text. You can remove unwanted add-ons during deal review.
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
            <button
              style={ghostBtn}
              onClick={onGetApproved}
            >
              GET APPROVED
            </button>
            <button
              style={ghostBtn}
              onClick={() => {
                const el = document.getElementById("shipping-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
            >
              BUY ONLINE (ESTIMATE)
            </button>
          </div>

          <div id="shipping-section" style={{ marginTop: "16px" }}>
            <div style={sectionTitle}>Estimate shipping</div>
            <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: 4 }}>
              $250 flat within 100 miles, then $2 per mile after that.
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <input
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
            <div style={{ marginTop: 6, fontSize: "12px", color: "#111827" }}>
              Shipping:{" "}
              <strong>
                {shipping > 0
                  ? `$${shipping.toLocaleString()}`
                  : "--"}
              </strong>
            </div>
            {shipping > 0 && (
              <div style={{ fontSize: "11px", color: "#6b7280" }}>
                Estimated total: $
                {(totalWithFees + shipping).toLocaleString()}
              </div>
            )}
          </div>

          <div style={subtle}>
            This is a demo marketplace using sample data for illustration only.
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
