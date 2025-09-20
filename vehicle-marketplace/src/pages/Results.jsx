import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { searchVehicles } from "../lib/vehicleApis";

function Card({ v }) {
  return (
    <Link
      to={`/vehicle/${encodeURIComponent(v.vin)}`}
      className="block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md"
    >
      <div className="aspect-[4/3] w-full bg-gray-100">
        {v.photo ? (
          <img
            src={v.photo}
            alt={v.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
            No photo
          </div>
        )}
      </div>

      <div className="space-y-1 p-4">
        <div className="flex items-start justify-between">
          <div className="text-sm text-gray-500">{v.city}</div>
          <div className="text-sm font-semibold">
            {v.price ? `$${v.price.toLocaleString()}` : "—"}
          </div>
        </div>

        <div className="font-medium text-gray-900">{v.title}</div>
        <div className="text-sm text-gray-500">
          {v.bodystyle} • {v.fuel} • {v.miles?.toLocaleString()} miles
        </div>
        <div className="text-xs text-gray-500">VIN {v.vin}</div>
      </div>
    </Link>
  );
}

export default function Results() {
  const [sp] = useSearchParams();
  const q = sp.get("q") || "";
  const [data, setData] = useState({ results: [], query: q, total: 0 });
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let alive = true;
    setStatus("loading");
    searchVehicles(q)
      .then((d) => alive && (setData(d), setStatus("ready")))
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, [q]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Vehicle Marketplace</h1>
        <Link
          to="/"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          New search
        </Link>
      </div>

      <div className="mb-6 text-sm text-gray-600">
        <div>
          <span className="font-medium">Results</span>
        </div>
        <div className="text-xs">
          Query: <span className="text-gray-800">{data.query || "—"}</span>
        </div>
        <div className="text-xs">{data.total} found</div>
      </div>

      {status === "loading" && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-xl bg-gray-100"
            />
          ))}
        </div>
      )}

      {status === "error" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load results.
        </div>
      )}

      {status === "ready" && (
        <>
          {data.results.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-600">
              No results. Try a broader query.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.results.map((v) => (
                <Card key={v.vin} v={v} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
