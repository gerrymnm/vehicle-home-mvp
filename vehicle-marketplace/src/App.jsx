import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import MarketHome from "./pages/MarketHome.jsx";
import Search from "./pages/Search.jsx";
import VehicleDetails from "./pages/VehicleDetails.jsx";
import DealerDashboard from "./pages/DealerDashboard.jsx";
import { AuthProvider, RequireAuth } from "./lib/auth.jsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <nav style={{ padding: 8 }}>
          <Link to="/" style={{ marginRight: 12 }}>Vehicle Home</Link>
          <Link to="/search">Search</Link>
          <span style={{ float: "right" }}><Link to="/dealer">Dealer</Link></span>
        </nav>
        <Routes>
          <Route path="/" element={<MarketHome />} />
          <Route path="/search" element={<Search />} />
          <Route path="/vehicles/:vin" element={<VehicleDetails />} />
          <Route
            path="/dealer"
            element={
              <RequireAuth roles={["dealer", "admin"]}>
                <DealerDashboard />
              </RequireAuth>
            }
          />
          <Route path="*" element={<div style={{ padding: 24 }}>Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
