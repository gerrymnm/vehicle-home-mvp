import React from "react";

const ROLES = [
  "Consumer",
  "Owner",
  "Dealer",
  "Bank",
  "Auction",
  "Insurance",
  "DMV",
];

export default function RoleSelector({ role, onChange }) {
  return (
    <select
      value={role}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg border border-gray-300 bg-white px-2 text-sm"
      title="View as"
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
