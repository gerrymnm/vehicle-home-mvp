// Full file: vehicle-marketplace/src/pages/VehicleDetails.jsx
import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getVehicle, getVehiclePhotos } from "../lib/api";
import Photos from "../components/Photos";
import History from "../components/History";

export default function VehicleDetails() {
  const { vin } = useParams();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [vehicle, setVehicle] = useState(null);
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const v = await getVehicle(vin);
        setVehicle(v.vehicle ?? v); // backend returns {ok,vehicle}
      } catch (e) {
        setErr(String(e.message || e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [vin]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const ph = await getVehiclePhotos(vin);
        const list = ph.photos ?? ph.images ?? [];
        if (alive) setPhotos(Array.isArray(list) ? list : []);
      } catch {
        // non-blocking for photos
      }
    })();
    return () => { alive = false; };
  }, [vin]);

  if (loading) return <p>Loading…</p>;
  if (err) return (
    <div>
      <Link to="/search">← Back to search</Link>
      <p style={{ color: "crimson" }}>Error: {err}</p>
    </div>
  );
  if (!vehicle) return (
    <div>
      <Link to="/search">← Back to search</Link>
      <p>No data.</p>
    </div>
  );

  const { year, make, model, trim, price, mileage, location, in_stock } = vehicle;
  const title = [year, make, model, trim].filter(Boolean).join(" ");

  return (
    <div>
      <Link to="/search">← Back to search</Link>

      <h2>{title || vin}</h2>
      <p>
        VIN: <strong>{vin}</strong>
        {price ? <> • ${Number(price).toLocaleString()}</> : null}
        {mileage ? <> • {Number(mileage).toLocaleString()} miles</> : null}
        {location ? <> • {location}</> : null}
      </p>
      <p>Status: {in_stock ? "in stock" : "not in stock"}</p>

      <h3>Photos</h3>
      <Photos images={photos} />

      <h3>Lien</h3>
      <p>No active lien reported.</p>

      <h3>Dealership Inspection</h3>
      <p>Not provided.</p>

      <h3>Compliance &amp; Records</h3>
      <p>Smog: unknown</p>
      <p>NMVTIS: brands unknown • Theft: unknown</p>
      <p>KSR: Not provided</p>

      <History vin={vin} />
    </div>
  );
}
