import React from "react";

export default function RecordsList({ records = [] }) {
  if (!records.length) {
    return <div className="rounded-xl border border-gray-200 p-4 text-sm text-gray-500">No public records found.</div>;
  }
  return (
    <div className="space-y-3">
      {records.map((r, idx) => (
        <div key={r.hash || r.cid || idx} className="rounded-xl border border-gray-200 p-4 text-sm bg-white">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-medium">
              {r.event || "Record"}{r.price_usd ? <span className="text-gray-500 ml-2"> • ${r.price_usd}</span> : null}
            </div>
            {r.timestamp && <div className="text-gray-500">{new Date(r.timestamp).toLocaleString()}</div>}
          </div>

          <div className="mt-2 grid sm:grid-cols-2 gap-2 text-gray-700">
            {(r.owner_type || r.owner_name) && (
              <div>
                <div className="text-xs uppercase text-gray-400">Owner</div>
                <div>{r.owner_type || "—"}{r.owner_name ? ` — ${r.owner_name}` : ""}</div>
              </div>
            )}
            {(r.location || r.mileage) && (
              <div>
                <div className="text-xs uppercase text-gray-400">Details</div>
                <div>{r.location || "—"}{r.mileage ? ` • ${r.mileage.toLocaleString()} miles` : ""}</div>
              </div>
            )}
            {r.vehicle && (
              <div className="sm:col-span-2">
                <div className="text-xs uppercase text-gray-400">Vehicle</div>
                <div>{r.vehicle}</div>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            {r.cid && <a href={`https://ipfs.io/ipfs/${r.cid}`} target="_blank" rel="noreferrer" className="underline text-gray-700 hover:text-black">IPFS JSON</a>}
            {r.hash && <span className="rounded bg-gray-100 px-2 py-1">Hash: {short(r.hash)}</span>}
            {r.sender && <span className="rounded bg-gray-100 px-2 py-1">Sender: {short(r.sender)}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
function short(v){return v?String(v).slice(0,6)+"…"+String(v).slice(-4):"";}
