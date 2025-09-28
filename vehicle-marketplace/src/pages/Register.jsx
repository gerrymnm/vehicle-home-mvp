// Full file: vehicle-marketplace/src/pages/Register.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { doRegister } from "../lib/auth";

export default function Register() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr(""); setOk("");
    try {
      await doRegister({ name, email, password });
      setOk("Account created. You can log in now.");
      setTimeout(() => nav("/login"), 600);
    } catch (e2) {
      setErr(String(e2.message || e2));
    }
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <h2>Create account</h2>
      <form onSubmit={onSubmit} className="bar" style={{ flexDirection: "column", alignItems: "stretch" }}>
        <input placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} required />
        <input type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
        <button type="submit">Create account</button>
      </form>
      {ok && <p style={{ color: "seagreen" }}>{ok}</p>}
      {err && <p style={{ color: "crimson" }}>Error: {err}</p>}
      <p className="muted" style={{ fontSize: 12 }}>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
