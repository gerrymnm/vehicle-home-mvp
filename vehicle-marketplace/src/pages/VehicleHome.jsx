import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { http } from "../lib/api.js";

export default function VehicleHome() {
  const { vin } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setError("");
      setVehicle(null);
      try {
        const data = await http.get(`/api/search?q=${encodeURIComponent(vin)}`);
        const v =
          (data.results || []).find((r) => r.vin === vin) ||
          (data.results || [])[0];
        if (!v) throw new Error("not found");
        if (mounted) setVehicle(v);
      } catch (e) {
        if (mounted) setError("Failed to load vehicle");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [vin]);

  if (error)
    return (
      <div style={{ padding: 24 }}>
        <p style={{ fontSize: 12, color: "#555" }}>Secured on blockchain</p>
        <Link to="/search">← Back to search</Link>
        <p style={{ color: "#c00", marginTop: 12 }}>Error: {error}</p>
      </div>
    );

  if (!vehicle)
    return (
      <div style={{ padding: 24 }}>
        <p style={{ fontSize: 12, color: "#555" }}>Secured on blockchain</p>
        <Link to="/search">← Back to search</Link>
        <p style={{ marginTop: 12 }}>Loading…</p>
      </div>
    );

  return (
    <div style={{ padding: 24, maxWidth: 960 }}>
      <p style={{ fontSize: 12, color: "#555" }}>Secured on blockchain</p>
      <Link to="/search">← Back to search</Link>

      <h2 style={{ marginTop: 16 }}>
        {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
      </h2>
      <p>VIN: {vehicle.vin}</p>
      <p>
        {vehicle.price ? `$${Number(vehicle.price).toLocaleString()}` : ""}
      </p>
      <p>
        {vehicle.mileage
          ? `${Number(vehicle.mileage).toLocaleString()} miles`
          : ""}{" "}
        • {vehicle.location || ""}
      </p>
      <p>Status: {vehicle.status || "In stock"}</p>

      <h3 style={{ marginTop: 24 }}>History</h3>
      <p>No history yet.</p>
    </div>
  );
}
