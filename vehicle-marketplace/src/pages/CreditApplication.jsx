// vehicle-marketplace/src/pages/CreditApplication.jsx
import React, { useState } from "react";
import { useLocation } from "react-router-dom";

const wrap = {
  maxWidth: 720,
  margin: "24px auto 40px",
  padding: "0 16px",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

const h1 = { fontSize: 22, fontWeight: 600, marginBottom: 8 };
const grid = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };
const input = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 12,
};
const label = { fontSize: 11, color: "#6b7280", marginBottom: 2 };
const full = { gridColumn: "1 / -1" };
const submitBtn = {
  marginTop: 14,
  padding: "10px 16px",
  borderRadius: 999,
  border: "none",
  background: "#111827",
  color: "#ffffff",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

export default function CreditApplication() {
  const location = useLocation();
  const prefillVehicle = location.state?.vehicle;

  const [submitted, setSubmitted] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div style={wrap}>
      <h1 style={h1}>Secure Credit Application</h1>
      <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>
        Fill out this secure form to get pre-qualified. In the production
        version, your information would be securely transmitted to our lending
        partners.
      </p>

      {prefillVehicle && (
        <div
          style={{
            fontSize: 11,
            marginBottom: 10,
            padding: "8px 10px",
            borderRadius: 10,
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}
        >
          Applying for:{" "}
          <strong>
            {prefillVehicle.year} {prefillVehicle.make} {prefillVehicle.model}
            {prefillVehicle.trim ? " " + prefillVehicle.trim : ""} (
            {prefillVehicle.vin})
          </strong>
        </div>
      )}

      {submitted ? (
        <p style={{ fontSize: 12, color: "#16a34a" }}>
          Application submitted (demo only). In a live deployment, this would
          route directly to lender systems.
        </p>
      ) : (
        <form onSubmit={submit} style={grid}>
          <div style={full}>
            <div style={label}>Full name</div>
            <input style={input} required />
          </div>

          <div>
            <div style={label}>Birthdate</div>
            <input type="date" style={input} required />
          </div>
          <div>
            <div style={label}>SSN</div>
            <input type="password" style={input} required />
          </div>

          <div>
            <div style={label}>Phone number</div>
            <input style={input} required />
          </div>
          <div>
            <div style={label}>Email</div>
            <input type="email" style={input} required />
          </div>

          <div style={full}>
            <div style={label}>Street address</div>
            <input style={input} required />
          </div>
          <div>
            <div style={label}>City</div>
            <input style={input} required />
          </div>
          <div>
            <div style={label}>State</div>
            <input style={input} required />
          </div>
          <div>
            <div style={label}>ZIP</div>
            <input style={input} required />
          </div>

          <div>
            <div style={label}>Employer</div>
            <input style={input} required />
          </div>
          <div>
            <div style={label}>Job title</div>
            <input style={input} required />
          </div>
          <div>
            <div style={label}>Monthly income (before tax)</div>
            <input style={input} required />
          </div>
          <div>
            <div style={label}>Time at job</div>
            <input style={input} required />
          </div>

          <div style={full}>
            <button type="submit" style={submitBtn}>
              Submit Application
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
