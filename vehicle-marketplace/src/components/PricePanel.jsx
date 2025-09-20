import React from "react";

export default function PricePanel({
  priceUsd,
  insights = {},
  dealerName,
  onContact,
  onShare,
}) {
  const { avg = 0, within50 = 0, delta30d = 0 } = insights;
  const deltaClass = delta30d < 0 ? "text-emerald-600" : "text-red-600";
  const deltaSymbol = delta30d < 0 ? "↓" : "↑";

  return (
    <div className="card p-4">
      <div className="text-3xl font-semibold">${priceUsd.toLocaleString()}</div>
      <div className={`text-xs ${deltaClass}`}>{deltaSymbol} {Math.abs(delta30d)}% over last 30 days</div>

      <div className="mt-4">
        <div className="text-sm font-medium">Market Insights</div>
        <div className="text-sm text-gray-600">
          Average list price for similar vehicles: ${avg.toLocaleString()}
        </div>
        <div className="text-sm text-gray-600">{within50} for sale within 50 miles</div>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={onContact} className="h-9 rounded-lg bg-black text-white px-4 text-sm">
          Contact Seller
        </button>
        <button
          onClick={onShare}
          className="h-9 rounded-lg border border-gray-300 bg-white px-4 text-sm"
        >
          Share
        </button>
      </div>

      <div className="mt-3 text-xs text-gray-500">Seller: {dealerName}</div>
    </div>
  );
}
