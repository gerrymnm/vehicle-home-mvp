import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = React.useState({
    email: "", password: "", role: "consumer", dealerName: ""
  });
  const [err, setErr] = React.useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      const payload = { email: form.email, password: form.password, role: form.role };
      if (form.role === "dealer") payload.dealerName = form.dealerName;
      await register(payload);
      nav("/");
    } catch (e2) {
      setErr("Registration failed");
    }
  }

  return (
    <section style={{maxWidth:480, margin:"32px auto"}}>
      <h2>Register</h2>
      <form onSubmit={onSubmit} style={{display:"grid", gap:12}}>
        <input placeholder="Email" type="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})}/>
        <input placeholder="Password" type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})}/>
        <label>
          Role:&nbsp;
          <select value={form.role} onChange={e=>setForm({...form, role:e.target.value})}>
            <option value="consumer">Consumer</option>
            <option value="dealer">Dealer</option>
          </select>
        </label>
        {form.role === "dealer" && (
          <input placeholder="Dealer name" value={form.dealerName} onChange={e=>setForm({...form, dealerName:e.target.value})}/>
        )}
        {err && <div style={{color:"crimson"}}>{err}</div>}
        <button>Create account</button>
      </form>
      <div style={{marginTop:8}}>Already registered? <Link to="/login">Login</Link></div>
    </section>
  );
}
