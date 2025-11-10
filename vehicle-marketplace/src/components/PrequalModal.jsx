import React, { useState } from "react";

const overlayStyle = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15,23,42,0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
};

const modalStyle = {
  width: "100%",
  maxWidth: 520,
  maxHeight: "90vh",
  overflowY: "auto",
  backgroundColor: "#ffffff",
  borderRadius: 14,
  boxShadow: "0 18px 45px rgba(15,23,42,0.35)",
  padding: 20,
};

const titleStyle = {
  fontSize: 18,
  fontWeight: 700,
  marginBottom: 4,
};

const subtitleStyle = {
  fontSize: 12,
  color: "#6b7280",
  marginBottom: 12,
};

const labelStyle = {
  fontSize: 11,
  fontWeight: 600,
  color: "#4b5563",
  marginBottom: 3,
};

const inputStyle = {
  width: "100%",
  padding: "8px 9px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  fontSize: 12,
  marginBottom: 8,
};

const rowStyle = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
};

const footerNoteStyle = {
  fontSize: 10,
  color: "#9ca3af",
  marginTop: 8,
  lineHeight: 1.4,
};

export default function PrequalModal({ onClose }) {
  const [form, setForm] = useState({
    fullName: "",
    dob: "",
    ssn: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    employer: "",
    jobTitle: "",
    employerPhone: "",
    income: "",
    timeOnJob: "",
  });

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    // Demo only – in production you'd POST this to your backend / lender APIs.
    console.log("Credit application (demo):", form);
    alert(
      "Application submitted (demo).\nIn production this would securely transmit to your lenders."
    );

    if (onClose) onClose();
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={titleStyle}>Get approved online</div>
            <div style={subtitleStyle}>
              Secure credit application. We’ll match your info to participating lenders.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              color: "#9ca3af",
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Personal */}
          <div style={{ marginBottom: 6, marginTop: 4, fontSize: 11, fontWeight: 700 }}>
            Personal information
          </div>
          <input
            style={inputStyle}
            placeholder="Full name"
            value={form.fullName}
            onChange={(e) => update("fullName", e.target.value)}
            required
          />
          <div style={rowStyle}>
            <div>
              <div style={labelStyle}>Birthdate</div>
              <input
                type="date"
                style={inputStyle}
                value={form.dob}
                onChange={(e) => update("dob", e.target.value)}
                required
              />
            </div>
            <div>
              <div style={labelStyle}>SSN (last 4 or full)</div>
              <input
                type="password"
                style={inputStyle}
                placeholder="XXX-XX-1234"
                value={form.ssn}
                onChange={(e) => update("ssn", e.target.value)}
                required
              />
            </div>
          </div>
          <div style={rowStyle}>
            <div>
              <div style={labelStyle}>Mobile phone</div>
              <input
                style={inputStyle}
                placeholder="(555) 555-5555"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                required
              />
            </div>
            <div>
              <div style={labelStyle}>Email</div>
              <input
                type="email"
                style={inputStyle}
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Address */}
          <div style={{ marginBottom: 6, marginTop: 8, fontSize: 11, fontWeight: 700 }}>
            Home address
          </div>
          <input
            style={inputStyle}
            placeholder="Street address"
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            required
          />
          <div style={rowStyle}>
            <input
              style={inputStyle}
              placeholder="City"
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              required
            />
            <input
              style={inputStyle}
              placeholder="State"
              value={form.state}
              onChange={(e) => update("state", e.target.value)}
              required
            />
          </div>
          <div style={rowStyle}>
            <input
              style={inputStyle}
              placeholder="ZIP"
              value={form.zip}
              onChange={(e) => update("zip", e.target.value)}
              required
            />
            <input
              style={inputStyle}
              placeholder="Housing payment (optional)"
              value={form.housing}
              onChange={(e) => update("housing", e.target.value)}
            />
          </div>

          {/* Employment */}
          <div style={{ marginBottom: 6, marginTop: 8, fontSize: 11, fontWeight: 700 }}>
            Employment & income
          </div>
          <input
            style={inputStyle}
            placeholder="Employer name"
            value={form.employer}
            onChange={(e) => update("employer", e.target.value)}
            required
          />
          <div style={rowStyle}>
            <input
              style={inputStyle}
              placeholder="Job title"
              value={form.jobTitle}
              onChange={(e) => update("jobTitle", e.target.value)}
              required
            />
            <input
              style={inputStyle}
              placeholder="Time on job (years)"
              value={form.timeOnJob}
              onChange={(e) => update("timeOnJob", e.target.value)}
            />
          </div>
          <div style={rowStyle}>
            <input
              style={inputStyle}
              placeholder="Monthly income (before taxes)"
              value={form.income}
              onChange={(e) => update("income", e.target.value)}
              required
            />
            <input
              style={inputStyle}
              placeholder="Employer phone (optional)"
              value={form.employerPhone}
              onChange={(e) => update("employerPhone", e.target.value)}
            />
          </div>

          <div style={footerNoteStyle}>
            By submitting, you authorize the selling dealer and its lending partners to obtain
            information from your credit report in connection with this application. This demo
            does not transmit or store any real data.
          </div>

          <button
            type="submit"
            style={{
              marginTop: 10,
              width: "100%",
              padding: "11px 14px",
              borderRadius: 999,
              border: "none",
              backgroundColor: "#111827",
              color: "#ffffff",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            Submit secure application
          </button>
        </form>
      </div>
    </div>
  );
}
