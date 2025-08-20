import { and, desc, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { fxRates } from "@/db/schema"; // create if you don't have it

// returns: {rate, effectiveDate} or null
export async function getTableRate(base: string, quote: string, onDate: string) {
  if (base === quote) return { rate: 1, effectiveDate: onDate };

  // direct pair on/before date
  const direct = await db.query.fxRates.findFirst({
    where: and(
      eq(fxRates.base_currency_code, base),
      eq(fxRates.quote_currency_code, quote),
      lte(fxRates.effective_date, onDate)
    ),
    orderBy: [desc(fxRates.effective_date)],
  });
  if (direct) return { rate: Number(direct.rate), effectiveDate: direct.effective_date };

  // simple triangulation through AED (pivot)
  const pivot = "AED";
  if (base !== pivot && quote !== pivot) {
    const leg1 = await getTableRate(base, pivot, onDate);
    const leg2 = await getTableRate(pivot, quote, onDate);
    if (leg1 && leg2) {
      return { rate: leg1.rate * leg2.rate, effectiveDate: onDate };
    }
  }
  return null; // caller can decide to fallback to 1 with "pending"
}