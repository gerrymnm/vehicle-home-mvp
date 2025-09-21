import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MarketHome from "./pages/MarketHome.jsx";
import Search from "./pages/Search.jsx";
import VehicleDetails from "./pages/VehicleDetails.jsx";
import DealerDashboard from "./pages/DealerDashboard.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import { AuthProvider, RequireAuth } from "./lib/auth.jsx";
import Header from "./components/Header.jsx";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<MarketHome />} />
          <Route path="/search" element={<Search />} />
          <Route path="/vehicles/:vin" element={<VehicleDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
