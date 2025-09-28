// Full file: vehicle-marketplace/src/pages/Register.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import auth from "../lib/auth.js";

export default function Register() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await auth.register({ name, email, password });
      nav("/dealer");
    } catch (e2) {
      setErr(String(e2.message || e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container">
      <h1>Register</h1>
      <form onSubmit={onSubmit} className="card" style={{ maxWidth: 420 }}>
        <label>Name</label>
        <input value={name} onChange={(e)=>setName(e.target.value)} required />

        <label>Email</label>
        <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />

        <label>Password</label>
        <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />

        {err && <p style={{ color: "crimson" }}>Error: {err}</p>}

        <button disabled={busy} type="submit">{busy ? "Creating..." : "Create account"}</button>

        <p className="muted" style={{ marginTop: 8 }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}
