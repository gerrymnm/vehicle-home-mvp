// src/lib/redact.js

// roles: "owner" | "dealer" | "auction" | "bank" | "insurer" | "dmv" | "guest"
export function redactRecordForRole(rec, role) {
  if (!rec?.json) return rec;

  const copy = JSON.parse(JSON.stringify(rec));

  const hidePriv = (obj) => {
    delete obj?.owner?.phone;
    delete obj?.owner?.email;
    delete obj?.owner?.account;
    delete obj?.owner_name; // common flat field you used
  };

  // full access for owner
  if (role === "owner") return copy;

  // DMV: access to most, but no personal contacts/ids
  if (role === "dmv") {
    hidePriv(copy.json);
    return copy;
  }

  // bank/insurer: see history + lien relevant, but no personal contacts
  if (role === "bank" || role === "insurer") {
    hidePriv(copy.json);
    return copy;
  }

  // dealer/auction/guest: hide prior owner identifying details
  if (role === "dealer" || role === "auction" || role === "guest") {
    hidePriv(copy.json);
    return copy;
  }

  return copy;
}
