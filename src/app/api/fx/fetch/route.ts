import { NextResponse } from "next/server";
import { db } from "@/db";
import { fxRate } from "@/db/schema";

// Currencies you care about
const CCYS = ["AED", "USD", "INR", "AUD"]; // extend if needed

async function fetchFrankfurter(base: string) {
  const res = await fetch(`https://api.frankfurter.app/latest?from=${base}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`FX fetch failed for ${base}`);
  return res.json() as Promise<{ base: string; date: string; rates: Record<string, number> }>;
}

export async function POST() {
  try {
    const inserts: any[] = [];

    for (const base of CCYS) {
      const data = await fetchFrankfurter(base);
      for (const [quote, rate] of Object.entries(data.rates)) {
        if (!CCYS.includes(quote)) continue;
        inserts.push({
          fromCode: base,
          toCode: quote,
          effectiveDate: data.date, // yyyy-mm-dd
          rate: rate.toString(),
          source: "provider",
          providerName: "frankfurter",
        });
      }
    }

    // Upsert by (fromCode, toCode, effectiveDate)
    for (const r of inserts) {
      db.insert(fxRate)
        .values(r as any)
        .onConflictDoUpdate({
          target: [fxRate.fromCode, fxRate.toCode, fxRate.effectiveDate],
          set: { rate: r.rate, source: r.source, providerName: r.providerName },
        })
        .run();
    }

    return NextResponse.json({ ok: true, inserted: inserts.length });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Failed to update rates" }, { status: 500 });
  }
}