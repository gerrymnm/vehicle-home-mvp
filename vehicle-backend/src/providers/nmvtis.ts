// Replace the internals with a real NMVTIS provider (VinAudit, ClearVin, AutoDataDirect).
// This stub also redacts PII before returning.

export type NmvtisSummary = {
  titleBrands: string[];           // e.g., ["Clean", "Salvage", "Rebuilt"]
  odometerReadings: { date: string; reading: number }[];
  totalLoss?: boolean;
  theftRecord?: boolean;
  lastTitleState?: string;         // e.g., "CA"
  lastTitleDate?: string;
  priorOwners?: number;            // non-PII count
  liens?: { present: boolean; count?: number }; // no lienholder names
};

export async function fetchNmvtis(vin: string, apiKey: string): Promise<NmvtisSummary> {
  // TODO: call real provider. For now return a static mock.
  await new Promise(r => setTimeout(r, 120)); // simulate network
  return {
    titleBrands: ["Clean"],
    odometerReadings: [
      { date: "2024-09-15", reading: 108900 },
      { date: "2023-06-01", reading: 98000 }
    ],
    totalLoss: false,
    theftRecord: false,
    lastTitleState: "CA",
    lastTitleDate: "2024-10-03",
    priorOwners: 2,
    liens: { present: false }
  };
}
