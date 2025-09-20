import React from "react";
import RoleSelector from "./RoleSelector.jsx";

export default function Header({ vin, onChangeVin, onLoad, role, onChangeRole }) {
  return (
    <header className="bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-10 border-b border-gray-200">
      <div className="container h-14 flex items-center gap-3">
        <div className="font-semibold">Vehicle Marketplace</div>
        <span className="hidden sm:inline text-gray-400">•</span>
        <div className="hidden sm:flex items-center gap-2 text-xs text-gray-600">
          <span className="dot" />
          <span>Secured on blockchain</span>
        </div>

        <div className="flex-1" />

        <RoleSelector role={role} onChange={onChangeRole} />

        <div className="flex items-center gap-2 ml-3">
          <input
            value={vin}
            onChange={(e) => onChangeVin(e.target.value)}
            className="h-9 w-[250px] rounded-lg border border-gray-300 px-3 text-sm"
            placeholder="Enter VIN"
          />
          <button
            onClick={onLoad}
            className="h-9 rounded-lg bg-black text-white px-4 text-sm"
          >
            Load
          </button>
        </div>
      </div>
    </header>
  );
}
