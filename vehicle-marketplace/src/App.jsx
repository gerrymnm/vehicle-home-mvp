import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Search from "./pages/Search.jsx";
import VehicleHome from "./pages/VehicleHome.jsx";
import CreditApplication from "./pages/CreditApplication.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Search />} />
        <Route path="/search" element={<Search />} />
        <Route path="/vehicles/:vin" element={<VehicleHome />} />
        <Route path="/apply" element={<CreditApplication />} />
      </Routes>
    </BrowserRouter>
  );
}
