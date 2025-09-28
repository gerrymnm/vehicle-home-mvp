// Full file: vehicle-marketplace/src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import VinLoader from "./components/VinLoader";
import Search from "./pages/Search";
import VehicleDetails from "./pages/VehicleDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import DealerDashboard from "./pages/DealerDashboard";
import Protected from "./components/Protected";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <main className="container">
        {/* Top utility bar */}
        <div className="bar" style={{ justifyContent: "space-between" }}>
          <VinLoader />
          <nav className="bar">
            <Link to="/search">Search</Link>
            <Link to="/dealer">Dealer</Link>
            <Link to="/login">Login</Link>
          </nav>
        </div>

        <h1>Vehicle Marketplace</h1>

        <Routes>
          <Route path="/" element={<Navigate to="/search" replace />} />
          <Route path="/search" element={<Search />} />
          <Route path="/vehicles/:vin" element={<VehicleDetails />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dealer"
            element={
              <Protected>
                <DealerDashboard />
              </Protected>
            }
          />

          <Route path="*" element={<p>Not found</p>} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
