// Full file: vehicle-marketplace/src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import MarketHome from "./pages/MarketHome.jsx";
import Search from "./pages/Search.jsx";
import VehicleHome from "./pages/VehicleHome.jsx";
import DealerDashboard from "./pages/DealerDashboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<MarketHome />} />
        <Route path="/search" element={<Search />} />
        <Route path="/vehicles/:vin" element={<VehicleHome />} />
        <Route path="/dealer" element={<DealerDashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* 404 fallback */}
        <Route path="*" element={<MarketHome />} />
      </Routes>
    </BrowserRouter>
  );
}

function Header() {
  return (
    <header className="site-header">
      <div className="container bar" style={{ justifyContent: "space-between" }}>
        <Link to="/" className="brand">Vehicle Marketplace</Link>
        <nav className="nav">
          <Link to="/search">Search</Link>
          <Link to="/dealer">Dealer</Link>
          <Link to="/login">Login</Link>
        </nav>
      </div>
    </header>
  );
}
