export type StickerInfo = {
  available: boolean;
  url?: string;       // PDF or image URL (S3/R2), not the raw file in response
  msrp?: number;
  options?: string[];
  fuelEconomy?: { city: number; highway: number };
};

export async function fetchWindowSticker(vin: string, apiKey: string): Promise<StickerInfo> {
  // TODO: call Monroney provider or OEM API. Mocked for now.
  await new Promise(r => setTimeout(r, 80));
  if (vin === "5J6TF3H33CL003984") {
    return {
      available: true,
      url: "https://filesamples.com/samples/document/pdf/sample3.pdf",
      msrp: 33120,
      options: ["EX-L Package", "Navigation"],
      fuelEconomy: { city: 18, highway: 27 }
    };
  }
  return { available: false };
}
