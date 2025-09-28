// Full file: vehicle-marketplace/src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import VinLoader from "./components/VinLoader";
import Search from "./pages/Search";
import VehicleDetails from "./pages/VehicleDetails";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <main className="container">
        <VinLoader />
        <h1>Vehicle Marketplace</h1>
        <Routes>
          <Route path="/" element={<Navigate to="/search" replace />} />
          <Route path="/search" element={<Search />} />
          <Route path="/vehicles/:vin" element={<VehicleDetails />} />
          <Route path="*" element={<p>Not found</p>} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
