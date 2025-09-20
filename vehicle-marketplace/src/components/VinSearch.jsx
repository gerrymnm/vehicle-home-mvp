// src/components/VinSearch.jsx
import { useState } from "react";

export default function VinSearch({ onLoad, defaultVin }) {
  const [vin, setVin] = useState(defaultVin || "");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        value={vin}
        onChange={(e)=>setVin(e.target.value.trim())}
        placeholder="Enter VIN"
        className="border rounded px-3 py-2 w-64"
      />
      <button
        onClick={()=>vin && onLoad(vin)}
        className="rounded px-3 py-2 bg-black text-white"
      >
        Load
      </button>
    </div>
  );
}
