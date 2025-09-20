import React from "react";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const nav = useNavigate();
  const [q, setQ] = React.useState("");

  function go(e) {
    e.preventDefault();
    nav(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <section style={{maxWidth:920, margin:"24px auto"}}>
      <h1>Find your next vehicle</h1>
      <form onSubmit={go} style={{display:"flex", gap:8}}>
        <input
          value={q}
          onChange={e=>setQ(e.target.value)}
          placeholder="Search by make, model, VIN..."
          style={{flex:1, padding:"10px 12px", fontSize:16}}
        />
        <button style={{padding:"10px 14px"}}>Search</button>
      </form>
      <p style={{opacity:.7, marginTop:8}}>Try: Mazda, Accord, Grand Cherokee</p>
    </section>
  );
}
