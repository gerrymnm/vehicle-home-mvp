// src/components/ContactDealerModal.jsx
import React from "react";

const backdrop = {
  position: "fixed",
  inset: 0,
  background: "rgba(15,23,42,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 40,
};

const box = {
  background: "#fff",
  borderRadius: 12,
  padding: 20,
  width: "100%",
  maxWidth: 420,
  boxShadow: "0 10px 30px rgba(15,23,42,0.18)",
};

export default function ContactDealerModal({ open, onClose, dealer }) {
  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    // For MVP we just close; integration can be added later.
    onClose && onClose();
    alert("Thanks! The dealer will contact you shortly. (Demo)");
  };

  return (
    <div style={backdrop} onClick={onClose}>
      <div style={box} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 600 }}>
          Contact {dealer?.name || "Dealer"}
        </h2>
        {dealer?.address && (
          <p
            style={{
              margin: "0 0 8px",
              fontSize: 12,
              color: "#6b7280",
            }}
          >
            {dealer.address}
          </p>
        )}
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            required
            placeholder="Full name"
            style={field}
          />
          <input
            required
            type="tel"
            placeholder="Phone number"
            style={field}
          />
          <input
            required
            type="email"
            placeholder="Email"
            style={field}
          />
          <textarea
            placeholder="How can we help?"
            rows={3}
            style={{ ...field, resize: "vertical" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor: "pointer",
                fontSize: 13,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: "#111827",
                color: "#fff",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const field = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 13,
};
