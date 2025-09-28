import React from "react";

// Tiny helper for a consistent badge look
function Badge({ label, status = "unknown" }) {
  const palette = {
    pass: { bg: "#e8f5e9", fg: "#1b5e20", border: "#c8e6c9" },
    fail: { bg: "#ffebee", fg: "#b71c1c", border: "#ffcdd2" },
    warn: { bg: "#fff8e1", fg: "#8d6e00", border: "#ffecb3" },
    unknown: { bg: "#eceff1", fg: "#37474f", border: "#cfd8dc" },
  };
  const { bg, fg, border } = palette[status] || palette.unknown;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 8px",
        borderRadius: 999,
        border: `1px solid ${border}`,
        background: bg,
        color: fg,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0.2,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      {label}
    </span>
  );
}

/**
 * Props (all optional, all default to 'unknown'):
 * - smog: 'pass' | 'fail' | 'warn' | 'unknown'
 * - nmvtis: same
 * - theft: same
 * - ksr: same
 */
export default function ComplianceBadges({
  smog = "unknown",
  nmvtis = "unknown",
  theft = "unknown",
  ksr = "unknown",
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      <Badge label={`Smog: ${smog}`} status={smog} />
      <Badge label={`NMVTIS: ${nmvtis}`} status={nmvtis} />
      <Badge label={`Theft: ${theft}`} status={theft} />
      <Badge label={`KSR: ${ksr}`} status={ksr} />
    </div>
  );
}
