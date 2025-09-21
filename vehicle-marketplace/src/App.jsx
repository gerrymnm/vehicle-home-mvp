import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import MarketHome from "./pages/MarketHome.jsx";
import Search from "./pages/Search.jsx";
import VehicleDetails from "./pages/VehicleDetails.jsx";
import Dealerdashboard from "./pages/Dealerdashboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import { AuthProvider, useAuth } from "./lib/auth.jsx";

function Nav() {
  const { user, logout } = useAuth();
  return (
    <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid #eee" }}>
      <div style={{ display: "flex", gap: 12 }}>
        <Link to="/">Vehicle Home</Link>
        <Link to="/search">Search</Link>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {user?.role === "dealer" && <Link to="/dealer">Dealer</Link>}
        {user ? (
          <>
            <span style={{ opacity: .7 }}>{user.email}</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<MarketHome />} />
          <Route path="/search" element={<Search />} />
          <Route path="/v/:vin" element={<VehicleDetails />} />
          <Route path="/dealer" element={<Dealerdashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
