// Full file: vehicle-marketplace/src/pages/Login.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import auth from "../lib/auth.js";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await auth.login({ email, password });
      nav("/dealer"); // send dealers to dashboard for now
    } catch (e2) {
      setErr(String(e2.message || e2));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="container">
      <h1>Login</h1>
      <form onSubmit={onSubmit} className="card" style={{ maxWidth: 420 }}>
        <label>Email</label>
        <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />

        <label>Password</label>
        <input type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required />

        {err && <p style={{ color: "crimson" }}>Error: {err}</p>}

        <button disabled={busy} type="submit">{busy ? "Signing in..." : "Login"}</button>

        <p className="muted" style={{ marginTop: 8 }}>
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </main>
  );
}
