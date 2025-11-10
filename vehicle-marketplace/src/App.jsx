// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Search from "./pages/Search.jsx";
import VehicleHome from "./pages/VehicleHome.jsx";
import CreditApplication from "./pages/CreditApplication.jsx";

const shell = {
  fontFamily: "-apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  color: "#111827",
};

const header = {
  borderBottom: "1px solid #e5e7eb",
  padding: "16px 24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const brand = {
  fontWeight: 700,
  fontSize: 20,
  textDecoration: "none",
  color: "#111827",
};

const nav = {
  display: "flex",
  gap: 16,
  fontSize: 14,
};

const link = {
  textDecoration: "none",
  color: "#4b5563",
};

export default function App() {
  return (
    <BrowserRouter>
      <div style={shell}>
        <header style={header}>
          <Link to="/" style={brand}>
            Vehicle Marketplace
          </Link>
          <nav style={nav}>
            <Link to="/search" style={link}>
              Search
            </Link>
            <Link to="/credit-application" style={link}>
              Get Approved
            </Link>
          </nav>
        </header>

        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/search" element={<Search />} />
          <Route path="/vehicles/:vin" element={<VehicleHome />} />
          <Route
            path="/credit-application"
            element={<CreditApplication />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
