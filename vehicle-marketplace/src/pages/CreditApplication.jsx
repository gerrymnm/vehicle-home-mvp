// src/pages/CreditApplication.jsx
import React from "react";

const wrap = { maxWidth: 720, margin: "24px auto", padding: "0 16px" };
const h1 = { fontSize: 22, fontWeight: 600, marginBottom: 12 };
const fieldRow = { display: "flex", gap: 12, marginBottom: 10 };
const label = {
  fontSize: 12,
  fontWeight: 500,
  marginBottom: 4,
  color: "#374151",
};
const input = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #d1d5db",
  fontSize: 13,
  width: "100%",
};

export default function CreditApplication() {
  const submit = (e) => {
    e.preventDefault();
    alert(
      "Application submitted (demo).\nIn production, this would securely transmit your info to the dealership / lender."
    );
  };

  return (
    <div style={wrap}>
      <h1 style={h1}>Credit Application</h1>
      <p
        style={{
          fontSize: 12,
          color: "#6b7280",
          marginBottom: 16,
        }}
      >
        Securely share your information with the dealership to get pre-qualified.
        (Demo only – no data is actually sent or stored.)
      </p>

      <form onSubmit={submit}>
        {/* Personal info */}
        <div style={fieldRow}>
          <div style={{ flex: 1 }}>
            <div style={label}>Full name</div>
            <input style={input} required />
          </div>
          <div style={{ width: 180 }}>
            <div style={label}>Birthdate</div>
            <input type="date" style={input} required />
          </div>
        </div>

        <div style={fieldRow}>
          <div style={{ flex: 1 }}>
            <div style={label}>Social Security Number</div>
            <input
              style={input}
              required
              placeholder="XXX-XX-XXXX"
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={label}>Phone number</div>
            <input style={input} required type="tel" />
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <div style={label}>Email</div>
          <input style={input} required type="email" />
        </div>

        {/* Address */}
        <div style={{ marginTop: 10, marginBottom: 4, fontSize: 13, fontWeight: 600 }}>
          Current Address
        </div>
        <div style={{ marginBottom: 10 }}>
          <div style={label}>Street</div>
          <input style={input} required />
        </div>
        <div style={fieldRow}>
          <div style={{ flex: 2 }}>
            <div style={label}>City</div>
            <input style={input} required />
          </div>
          <div style={{ flex: 1 }}>
            <div style={label}>State</div>
            <input style={input} required />
          </div>
          <div style={{ flex: 1 }}>
            <div style={label}>ZIP</div>
            <input style={input} required />
          </div>
        </div>

        {/* Employment */}
        <div style={{ marginTop: 14, marginBottom: 4, fontSize: 13, fontWeight: 600 }}>
          Employment & Income
        </div>
        <div style={fieldRow}>
          <div style={{ flex: 2 }}>
            <div style={label}>Employer name</div>
            <input style={input} required />
          </div>
          <div style={{ flex: 1 }}>
            <div style={label}>Job title</div>
            <input style={input} required />
          </div>
        </div>
        <div style={fieldRow}>
          <div style={{ flex: 1 }}>
            <div style={label}>Monthly income (before taxes)</div>
            <input
              style={input}
              required
              type="number"
              min="0"
            />
          </div>
          <div style={{ flex: 1 }}>
            <div style={label}>Time at job</div>
            <input style={input} required placeholder="e.g. 2 years" />
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={label}>Additional notes (optional)</div>
          <textarea
            rows={3}
            style={{ ...input, resize: "vertical" }}
            placeholder="Tell us about your vehicle of interest, down payment, etc."
          />
        </div>

        <button
          type="submit"
          style={{
            marginTop: 16,
            padding: "10px 20px",
            borderRadius: 8,
            border: "none",
            background: "#111827",
            color: "#fff",
            fontWeight: 600,
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          Submit Application (Demo)
        </button>
      </form>
    </div>
  );
}
