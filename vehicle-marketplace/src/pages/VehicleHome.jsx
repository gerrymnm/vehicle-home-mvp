import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import http from "../lib/api.js";

export default function VehicleHome() {
  const { vin } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");
    http
      .get(`/search?q=${encodeURIComponent(vin)}`)
      .then((r) => {
        const v = (r.results || []).find((x) => (x.vin || "").toUpperCase() === vin.toUpperCase());
        if (!alive) return;
        if (!v) {
          setErr("Not found");
          setVehicle(null);
        } else {
          setVehicle(v);
        }
      })
      .catch(() => {
        if (alive) setErr("Failed to load vehicle");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [vin]);

  if (loading) return <p>Loading…</p>;
  if (err) return (
    <div>
      <p><Link to="/search">← Back to search</Link></p>
      <p style={{ color: "crimson" }}>Error: {err}</p>
    </div>
  );
  if (!vehicle) return (
    <div>
      <p><Link to="/search">← Back to search</Link></p>
      <p>No vehicle.</p>
    </div>
  );

  return (
    <div>
      <p><Link to="/search">← Back to search</Link></p>
      <h1>{vehicle.title}</h1>
      <p>VIN: {vehicle.vin}</p>
      <p>{vehicle.price ? `$${vehicle.price.toLocaleString()}` : ""}</p>
      <p>{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} miles` : ""} • {vehicle.location || ""}</p>
      <p>Status: {vehicle.status || "In stock"}</p>
      <h3>History</h3>
      <p>No history yet.</p>
    </div>
  );
}
