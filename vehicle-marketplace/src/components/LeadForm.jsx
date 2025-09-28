import React, { useState } from "react";
import api from "../lib/api.js";

export default function LeadForm({ vin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setOk(false);

    // very light validation
    if (!vin) return setErr("Missing VIN.");
    if (!name.trim()) return setErr("Please provide your name.");
    if (!email.trim() && !phone.trim())
      return setErr("Provide at least an email or phone.");

    try {
      setBusy(true);
      await api.createLead(vin, { name, email, phone, message });
      setOk(true);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch (e) {
      setErr(e?.message || "Failed to submit lead.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ maxWidth: 520 }}>
      <h3 style={{ marginTop: 0 }}>Contact the Seller</h3>
      {ok && <p style={{ color: "green" }}>Thanks! We’ll be in touch soon.</p>}
      {err && <p style={{ color: "crimson" }}>Error: {err}</p>}

      <div style={row}>
        <label style={label}>Name</label>
        <input
          style={input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
        />
      </div>

      <div style={row}>
        <label style={label}>Email</label>
        <input
          style={input}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
          type="email"
        />
      </div>

      <div style={row}>
        <label style={label}>Phone</label>
        <input
          style={input}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 123-4567"
        />
      </div>

      <div style={row}>
        <label style={label}>Message</label>
        <textarea
          style={{ ...input, minHeight: 90, resize: "vertical" }}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="I'd like to know more about this vehicle."
        />
      </div>

      <button
        type="submit"
        disabled={busy}
        style={{
          padding: "10px 14px",
          background: busy ? "#9e9e9e" : "#1a73e8",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: busy ? "default" : "pointer",
          fontWeight: 600,
        }}
      >
        {busy ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

const row = { marginBottom: 10, display: "flex", flexDirection: "column" };
const label = { fontSize: 12, color: "#666", marginBottom: 4 };
const input = {
  padding: "8px 10px",
  border: "1px solid #ddd",
  borderRadius: 6,
  outline: "none",
};
