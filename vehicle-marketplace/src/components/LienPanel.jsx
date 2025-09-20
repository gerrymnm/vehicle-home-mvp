// src/components/LienPanel.jsx
import React from "react";
import { can } from "../lib/permissions";

export default function LienPanel({ role, lien, onAdd, onRelease }) {
  if (!can(role, "lien.view")) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Lien</h3>
        <div className="flex items-center gap-2">
          {can(role, "lien.add") && !lien && (
            <button
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
              onClick={onAdd}
            >
              Assign lien
            </button>
          )}
          {can(role, "lien.release") && lien && (
            <button
              className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-200"
              onClick={onRelease}
            >
              Release lien
            </button>
          )}
        </div>
      </div>

      {!lien ? (
        <p className="text-sm text-gray-500">No lien on record.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Holder</div>
            <div className="font-medium text-gray-800">{lien.holder}</div>
          </div>
          <div>
            <div className="text-gray-400">Status</div>
            <div className="font-medium text-gray-800">{lien.status}</div>
          </div>
          <div>
            <div className="text-gray-400">Start</div>
            <div className="font-medium text-gray-800">{lien.start}</div>
          </div>
          <div>
            <div className="text-gray-400">Balance</div>
            <div className="font-medium text-gray-800">${lien.balance.toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
