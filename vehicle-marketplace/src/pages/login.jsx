import React from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = React.useState({ email: "", password: "" });
  const [err, setErr] = React.useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      await login(form.email, form.password);
      const dest = (loc.state && loc.state.from && loc.state.from.pathname) || "/";
      nav(dest);
    } catch (e2) {
      setErr("Invalid credentials");
    }
  }

  return (
    <section style={{maxWidth:420, margin:"32px auto"}}>
      <h2>Login</h2>
      <form onSubmit={onSubmit} style={{display:"grid", gap:12}}>
        <input placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
        <input placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})}/>
        {err && <div style={{color:"crimson"}}>{err}</div>}
        <button>Sign in</button>
      </form>
      <div style={{marginTop:8}}>No account? <Link to="/register">Register</Link></div>
    </section>
  );
}
