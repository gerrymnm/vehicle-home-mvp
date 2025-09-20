// src/components/RoleSwitcher.jsx
import React from "react";
import { ROLES } from "../lib/permissions";

export default function RoleSwitcher({ role, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500">Demo role</span>
      <select
        value={role}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
      >
        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
      </select>
    </div>
  );
}
