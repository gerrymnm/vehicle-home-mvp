import React from "react";
import { useNavigate } from "react-router-dom";

export default function MarketHome() {
  const nav = useNavigate();
  const [q, setQ] = React.useState("");

  function go(e) {
    e.preventDefault();
    nav(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <section style={{ maxWidth: 800, margin: "24px auto" }}>
      <h2>Find your next vehicle</h2>
      <form onSubmit={go} style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input
          style={{ padding: 8, flex: 1 }}
          placeholder="Search by make, model, VIN…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button>Search</button>
      </form>
      <div style={{ marginTop: 8, opacity: .7, fontSize: 13 }}>
        Try: <em>Mazda, Accord, Grand Cherokee</em>
      </div>
    </section>
  );
}
