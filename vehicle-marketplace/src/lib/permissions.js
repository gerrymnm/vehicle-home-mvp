// src/lib/permissions.js
export const ROLES = [
  "Consumer",     // public viewer / shopper
  "Owner",        // private vehicle owner
  "Dealer",       // franchise/independent dealer
  "Auction",      // auction house
  "Bank",         // lender
  "Insurance",    // insurer
  "DMV"           // state agency
];

// Central policy. Keep it flat and human-readable.
const policy = {
  // Photos
  "photos.view"   : ["Owner","Dealer","Auction","Bank","Insurance","DMV","Consumer"],
  "photos.upload" : ["Dealer","Auction"],                 // Owner uploads only via events (handled in UI copy)
  // Records
  "records.view.public"   : ["*"],                        // everyone
  "records.view.private"  : ["Owner","DMV"],              // owner + DMV only
  "records.add"           : ["Dealer","Auction","DMV"],   // demo: lenders/insurers don’t create records here
  // PII
  "pii.owner_name" : ["Owner","DMV"],                    // only owner & DMV see owner’s name
  // Finance
  "lien.view"  : ["Bank","Insurance","DMV","Owner"],      // owner sees their own lien; not public
  "lien.add"   : ["Bank"],                                // bank can place liens
  "lien.release": ["Bank"],                               // bank can release
  // Marketplace
  "contact.seller" : ["Consumer","Dealer","Auction","Bank","Insurance","Owner","DMV"],
  "share.listing"  : ["*"],
};

// small helper
export function can(role, permission) {
  const allowed = policy[permission];
  if (!allowed) return false;
  if (allowed.includes("*")) return true;
  return allowed.includes(role);
}
