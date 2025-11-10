// vehicle-marketplace/src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Search from "./pages/Search.jsx";
import VehicleHome from "./pages/VehicleHome.jsx";
import CreditApplication from "./pages/CreditApplication.jsx";

const shell = {
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
};

const header = {
  borderBottom: "1px solid #e5e7eb",
  padding: "10px 24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const brand = {
  fontWeight: 700,
  fontSize: "18px",
  color: "#111827",
  textDecoration: "none",
};

const nav = {
  display: "flex",
  gap: "14px",
  fontSize: "13px",
};

const navLink = {
  color: "#4b5563",
  textDecoration: "none",
};

const main = {
  minHeight: "calc(100vh - 52px)",
};

function Layout() {
  return (
    <div style={shell}>
      <header style={header}>
        <Link to="/" style={brand}>
          Vehicle Marketplace
        </Link>
        <nav style={nav}>
          <Link to="/search" style={navLink}>
            Search
          </Link>
          <Link to="/apply" style={navLink}>
            Credit Application
          </Link>
        </nav>
      </header>
      <main style={main}>
        <Routes>
          <Route path="/" element={<Search />} />
          <Route path="/search" element={<Search />} />
          <Route path="/vehicles/:vin" element={<VehicleHome />} />
          <Route path="/apply" element={<CreditApplication />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
