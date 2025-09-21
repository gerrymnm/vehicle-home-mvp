import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import MarketHome from "./pages/MarketHome.jsx";
import Search from "./pages/Search.jsx";
import VehicleDetails from "./pages/VehicleDetails.jsx";
import DealerDashboard from "./pages/DealerDashboard.jsx";
import { AuthProvider, RequireAuth, useAuth } from "./lib/auth.jsx";

function Nav() {
  const { user, logout } = useAuth();
  return (
    <div style={{ display: "flex", gap: 16, padding: 12, borderBottom: "1px solid #eee" }}>
      <Link to="/">Vehicle Home</Link>
      <Link to="/search">Search</Link>
      <div style={{ marginLeft: "auto" }}>
        {user ? (
          <>
            <Link to="/dealer" style={{ marginRight: 12 }}>Dealer</Link>
            <span style={{ marginRight: 12 }}>{user.email}</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : null}
      </div>
    </div>
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
          <Route path="/vehicles/:vin" element={<VehicleDetails />} />
          <Route path="/dealer" element={<RequireAuth roles={["dealer","admin"]}><DealerDashboard /></RequireAuth>} />
          <Route path="*" element={<div style={{ padding: 24 }}>Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
