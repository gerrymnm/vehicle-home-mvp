// vehicle-marketplace/src/components/ContactDealerModal.jsx
import React, { useState } from "react";

const overlay = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15,23,42,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 40,
};

const box = {
  width: "100%",
  maxWidth: 420,
  background: "#ffffff",
  borderRadius: 16,
  padding: "18px 18px 16px",
  boxShadow: "0 20px 60px rgba(15,23,42,0.25)",
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

const input = {
  width: "100%",
  marginTop: 6,
  marginBottom: 8,
  padding: "7px 9px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 12,
};

const btnRow = {
  display: "flex",
  gap: 8,
  marginTop: 8,
};

const primary = {
  flex: 1,
  padding: "8px 10px",
  borderRadius: 999,
  border: "none",
  background: "#111827",
  color: "#ffffff",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
};

const ghost = {
  flex: 1,
  padding: "8px 10px",
  borderRadius: 999,
  border: "1px solid #d1d5db",
  background: "#ffffff",
  color: "#111827",
  fontSize: 13,
  cursor: "pointer",
};

export default function ContactDealerModal({ vehicle, dealer, onClose }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    // For MVP: pretend to send, then show confirmation.
    setSent(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={box} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>
          Contact {dealer?.name || "dealer"}
        </h2>
        <p style={{ fontSize: 11, color: "#6b7280", margin: "4px 0 8px" }}>
          Ask about the {vehicle?.year} {vehicle?.make} {vehicle?.model}
          {vehicle?.trim ? " " + vehicle.trim : ""} (VIN {vehicle?.vin}).
        </p>

        {sent ? (
          <p style={{ fontSize: 12, color: "#16a34a" }}>
            Your message has been recorded for this demo. In production this would send
            directly to the dealer CRM.
          </p>
        ) : (
          <form onSubmit={submit}>
            <input
              style={input}
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              style={input}
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <input
              style={input}
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <textarea
              style={{ ...input, minHeight: 60, resize: "vertical" }}
              placeholder="How can we help?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div style={btnRow}>
              <button type="button" style={ghost} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" style={primary}>
                Send message
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
