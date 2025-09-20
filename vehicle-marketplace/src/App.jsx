import React from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";

// IMPORTANT: match the exact filenames/casing in /src/pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Search from "./pages/Search";
import Vehicledetails from "./pages/VehicleDetails";     // file is Vehicledetails.jsx
import Dealerdashboard from "./pages/Dealerdashboard";   // file is Dealerdashboard.jsx

import { useAuth, RequireAuth } from "./lib/auth.jsx";

function Nav() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <header style={{display:"flex",gap:16,alignItems:"center",padding:"12px 16px",borderBottom:"1px solid #ddd"}}>
      <Link to="/">Vehicle Home</Link>
      <Link to="/search">Search</Link>
      <div style={{marginLeft:"auto"}} />
      {user ? (
        <>
          {user.role === "dealer" && <Link to="/dealer">Dealer</Link>}
          <span style={{opacity:.7, marginRight:8}}>{user.email}</span>
          <button onClick={()=>{ logout(); nav("/"); }} style={{padding:"6px 10px"}}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </header>
  );
}

export default function App() {
  return (
    <>
      <Nav />
      <main style={{padding:"16px"}}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/vehicles/:vin" element={<Vehicledetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dealer"
            element={
              <RequireAuth roles={["dealer","admin"]}>
                <Dealerdashboard />
              </RequireAuth>
            }
          />
          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </main>
    </>
  );
}
