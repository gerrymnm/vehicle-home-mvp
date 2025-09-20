import { useEffect, useState } from "react";

function useVehicleHome(vin) {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    fetch(`/api/vehicles/${vin}/full`)
      .then(r => r.json())
      .then(d => { if (alive) { setData(d); setStatus("ready"); } })
      .catch(() => alive && setStatus("error"));
    return () => { alive = false; };
  }, [vin]);

  return { data, status };
}

function VehicleCard({ vin }) {
  const { data, status } = useVehicleHome(vin);

  if (status === "loading") return <p>Loading...</p>;
  if (status === "error") return <p>Failed to load vehicle</p>;
  if (!data) return <p>No vehicle found</p>;

  return (
    <div>
      <h1>{data.core.year} {data.core.make} {data.core.model}</h1>
      <p>{data.core.mileage} miles</p>
      <p>VIN: {data.vin}</p>
      {data.photos?.map((url, i) => (
        <img key={i} src={url} alt="Vehicle" className="w-64 rounded" />
      ))}
    </div>
  );
}

export default VehicleCard;
