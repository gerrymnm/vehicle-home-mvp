import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import http from "../lib/api.js";

export default function VehicleHome() {
  const { vin } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!vin) return;
    setError("");
    setVehicle(null);
    http
      .get(`/api/vehicles/${vin}`)
      .then((data) => setVehicle(data))
      .catch((e) => setError(`Error: ${e.message.replace(/\n/g, " ")}`));
  }, [vin]);

  if (error)
    return (
      <div style={{ maxWidth: 900, margin: "24px auto" }}>
        <Link to="/search">← Back to search</Link>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );

  if (!vehicle)
    return (
      <div style={{ maxWidth: 900, margin: "24px auto" }}>
        <Link to="/search">← Back to search</Link>
        <p>Loading...</p>
      </div>
    );

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: "24px auto",
        display: "grid",
        gridTemplateColumns: "1fr 320px",
        gap: 24,
      }}
    >
      <div>
        <Link to="/search">← Back to search</Link>
        <h1 style={{ marginTop: 12 }}>
          {`${vehicle.year} ${vehicle.make} ${vehicle.model}${
            vehicle.trim ? " " + vehicle.trim : ""
          }`}
        </h1>
        <p>VIN: {vehicle.vin}</p>
        {"price" in vehicle ? <p>${Number(vehicle.price).toLocaleString()}</p> : null}
        <p>{`${vehicle.mileage?.toLocaleString?.() || ""} miles • ${vehicle.location || ""}`}</p>
        <p>Status: {vehicle.status || "In stock"}</p>
        <h3 style={{ marginTop: 24 }}>History</h3>
        <p>No history yet.</p>
      </div>
      <aside>
        <div style={{ border: "1px solid #ddd", borderRadius: 6, padding: 12 }}>
          <h4>Contact dealer</h4>
          <input placeholder="Your name" style={{ width: "100%", marginBottom: 8 }} />
          <input placeholder="Email" style={{ width: "100%", marginBottom: 8 }} />
          <input placeholder="Phone" style={{ width: "100%", marginBottom: 8 }} />
          <textarea placeholder="Message" rows={5} style={{ width: "100%", marginBottom: 8 }} />
          <button style={{ width: "100%" }}>Send</button>
        </div>
      </aside>
    </div>
  );
}
