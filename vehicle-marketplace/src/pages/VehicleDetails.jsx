import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../lib/api.js";
import PhotoGrid from "../components/PhotoGrid.jsx";
import History from "../components/History.jsx";
import ComplianceBadges from "../components/ComplianceBadges.jsx";
import LeadForm from "../components/LeadForm.jsx";

export default function VehicleDetails() {
  const { vin } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");

    Promise.all([api.vehicle(vin), api.photos(vin)])
      .then(([v, p]) => {
        if (!alive) return;
        const veh = v?.vehicle ?? v;
        setVehicle(veh || null);

        const imgs = Array.isArray(p?.photos) ? p.photos : Array.isArray(p) ? p : [];
        setPhotos(imgs);
      })
      .catch((e) => alive && setErr(e?.message || "Failed to load vehicle"))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [vin]);

  if (loading) return <p style={{ color: "#666" }}>Loading…</p>;
  if (err) return <p style={{ color: "crimson" }}>Error: {err}</p>;
  if (!vehicle) return <p>No vehicle found.</p>;

  const { year, make, model, trim, price, mileage, location, in_stock } = vehicle;

  // if you later add compliance fields to the backend, map them here;
  // for now we surface "unknown" which renders neutral badges
  const compliance = {
    smog: "unknown",
    nmvtis: "unknown",
    theft: "unknown",
    ksr: "unknown",
  };

  return (
    <div>
      <p>
        <Link to={`/search?q=${encodeURIComponent(make || "")}`}>← Back to search</Link>
      </p>

      <h2 style={{ margin: "8px 0 4px" }}>
        {year} {make} {model} {trim ? <span>{trim}</span> : null}
      </h2>
      <p style={{ margin: "0 0 12px", color: "#444" }}>
        VIN: {vin}
        {price != null && ` • $${Number(price).toLocaleString()}`}
        {mileage != null && ` • ${Number(mileage).toLocaleString()} miles`}
        {location ? ` • ${location}` : ""}
        {typeof in_stock === "boolean" ? ` • Status: ${in_stock ? "in stock" : "sold"}` : ""}
      </p>

      {/* Photos */}
      <section style={{ marginTop: 12 }}>
        <h3>Photos</h3>
        <PhotoGrid photos={photos} />
      </section>

      {/* Compliance / Records as badges */}
      <section style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 8 }}>Compliance &amp; Records</h3>
        <ComplianceBadges
          smog={compliance.smog}
          nmvtis={compliance.nmvtis}
          theft={compliance.theft}
          ksr={compliance.ksr}
        />
      </section>

      {/* Seller/lead form */}
      <section style={{ marginTop: 24 }}>
        <LeadForm vin={vin} />
      </section>

      {/* History with filter */}
      <section style={{ marginTop: 28 }}>
        <History vin={vin} />
      </section>
    </div>
  );
}
