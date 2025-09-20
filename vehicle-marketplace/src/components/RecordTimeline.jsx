import React, { useMemo, useState } from "react";

const COLORS = {
  listed_for_sale: "text-blue-600",
  serviced: "text-emerald-600",
  lien: "text-purple-600",
  insurance: "text-orange-600",
  sold: "text-gray-600",
  other: "text-gray-600",
};

const LABELS = {
  listed_for_sale: "Listed for sale",
  serviced: "Vehicle serviced",
  lien: "Lien / Title update",
  insurance: "Insurance event",
  sold: "Ownership change",
  other: "Record",
};

const FILTERS = [
  { key: "all", label: "All Records" },
  { key: "listed_for_sale", label: "For sale" },
  { key: "serviced", label: "Serviced" },
  { key: "lien", label: "Lien/Title" },
  { key: "insurance", label: "Insurance" },
  { key: "sold", label: "Sold/Ownership" },
];

export default function RecordTimeline({
  role = "Consumer",
  events = [],
  defaultFilter = "all",
  defaultGrouped = false,
}) {
  const [filter, setFilter] = useState(defaultFilter);
  const [grouped, setGrouped] = useState(defaultGrouped);

  // role-based visibility sample (hide ownership name for non-PII roles):
  const showPII = role === "Owner" || role === "Bank" || role === "Insurance" || role === "DMV";

  const filtered = useMemo(() => {
    if (filter === "all") return events.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    return events.filter((e) => e.type === filter).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [events, filter]);

  const groupedMap = useMemo(() => {
    if (!grouped) return null;
    const map = {};
    for (const e of filtered) {
      const k = e.type || "other";
      if (!map[k]) map[k] = [];
      map[k].push(e);
    }
    return map;
  }, [filtered, grouped]);

  if (!events || events.length === 0) {
    return <div className="text-gray-500 text-sm">No public records found.</div>;
  }

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center gap-2 mb-3">
        <select
          className="border rounded-md px-2 py-1 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {FILTERS.map((f) => (
            <option key={f.key} value={f.key}>{f.label}</option>
          ))}
        </select>

        <label className="text-sm text-gray-600 inline-flex items-center gap-2 select-none">
          <input
            type="checkbox"
            className="accent-black"
            checked={grouped}
            onChange={(e) => setGrouped(e.target.checked)}
          />
          Group by type
        </label>
      </div>

      {/* List */}
      {!grouped && (
        <ul className="space-y-2">
          {filtered.map((e, idx) => (
            <li key={idx} className="rounded-lg border bg-white p-3 flex items-start justify-between">
              <div>
                <div className={`font-medium ${COLORS[e.type] || COLORS.other}`}>
                  {LABELS[e.type] || LABELS.other}
                </div>
                <div className="text-sm text-gray-600">
                  {e.note || e.details || "-"}
                  {e.type === "sold" && !showPII ? " (private party)" : ""}
                </div>
              </div>
              <div className="text-xs text-gray-500 tabular-nums whitespace-nowrap">{e.date || ""}</div>
            </li>
          ))}
        </ul>
      )}

      {grouped && groupedMap && (
        <div className="space-y-4">
          {Object.keys(groupedMap).map((k) => (
            <div key={k}>
              <div className={`mb-2 font-medium ${COLORS[k] || COLORS.other}`}>
                {LABELS[k] || LABELS.other}
              </div>
              <ul className="space-y-2">
                {groupedMap[k].map((e, idx) => (
                  <li key={idx} className="rounded-lg border bg-white p-3 flex items-start justify-between">
                    <div className="text-sm text-gray-600">
                      {e.note || e.details || "-"}
                      {e.type === "sold" && !showPII ? " (private party)" : ""}
                    </div>
                    <div className="text-xs text-gray-500 tabular-nums whitespace-nowrap">{e.date || ""}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

