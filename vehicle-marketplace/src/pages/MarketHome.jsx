import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function MarketHome({ setQuery }) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  const onSearch = (e) => {
    e.preventDefault();
    const value = q.trim();
    if (!value) return;
    setQuery(value);
    navigate("/search");
  };

  return (
    <div
      style={{
        fontFamily: "ui-sans-serif, system-ui",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "48px 20px",
      }}
    >
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>
        Find your next vehicle
      </h1>

      <form
        onSubmit={onSearch}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          maxWidth: 680,
          gap: "10px",
        }}
      >
        <input
          type="text"
          placeholder='Try: "2019–2021 Honda SUV under $20k in SF"'
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{
            flex: 1,
            padding: "14px 16px",
            borderRadius: 10,
            border: "1px solid #d1d5db",
            fontSize: 16,
          }}
        />
        <button
          type="submit"
          style={{
            padding: "12px 18px",
            borderRadius: 10,
            background: "#111827",
            color: "white",
            fontWeight: 600,
          }}
        >
          Search
        </button>
        <button
          type="button"
          title="Voice (demo)"
          style={{
            padding: "12px",
            borderRadius: 10,
            border: "1px solid #d1d5db",
            background: "#fff",
          }}
          onClick={() =>
            alert("Voice search (demo). On device: convert speech to text, then search.")
          }
        >
          🎤
        </button>
      </form>

      <div style={{ marginTop: 28, textAlign: "left", width: "100%", maxWidth: 680 }}>
        <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 8 }}>Examples</p>
        <ul style={{ listStyle: "disc", paddingLeft: 20, fontSize: 15, color: "#374151" }}>
          <li>"Mazda CX-5 2020+ under $25k"</li>
          <li>"Electric SUV under $30k"</li>
          <li>"2012 Honda Crosstour VIN 5J6TF3H33CL003984"</li>
        </ul>
      </div>
    </div>
  );
}
