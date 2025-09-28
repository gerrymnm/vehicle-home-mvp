// Full file: vehicle-marketplace/src/components/VinLoader.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function VinLoader() {
  const [role, setRole] = useState("Consumer");
  const [vin, setVin] = useState("");
  const nav = useNavigate();

  function onSubmit(e) {
    e.preventDefault();
    const cleaned = vin.trim().toUpperCase();
    if (!cleaned) return;
    nav(`/vehicles/${encodeURIComponent(cleaned)}`);
  }

  return (
    <form onSubmit={onSubmit} className="bar" aria-label="Secured on blockchain">
      <span className="muted" style={{ fontSize: 12 }}>Secured on blockchain</span>
      <select value={role} onChange={(e) => setRole(e.target.value)}>
        <option>Consumer</option>
        <option>Dealer</option>
        <option>Inspector</option>
      </select>
      <input
        value={vin}
        onChange={(e) => setVin(e.target.value)}
        placeholder="Enter VIN"
        aria-label="VIN"
      />
      <button type="submit">Load</button>
    </form>
  );
}
