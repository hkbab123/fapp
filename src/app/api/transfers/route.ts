import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { account, fxRate, transfer } from "@/db/schema";
import { ulid } from "ulid";
import { eq, and, lte, desc } from "drizzle-orm";

// --- FX helpers -------------------------------------------------------------

function findDirect(base: string, quote: string, onDate: string) {
  // Latest rate on or before the given date
  const rows = db
    .select()
    .from(fxRate)
    .where(and(eq(fxRate.fromCode, base), eq(fxRate.toCode, quote), lte(fxRate.effectiveDate, onDate)))
    .orderBy(desc(fxRate.effectiveDate))
    .all();
  return rows[0] ?? null;
}

function getBestRate(base: string, quote: string, onDate: string): { rate: number; source: "same_currency" | "direct" | "reverse" | "triangulated" } | null {
  if (base === quote) return { rate: 1, source: "same_currency" };

  // 1) direct (latest on/before date)
  const direct = findDirect(base, quote, onDate);
  if (direct) return { rate: Number(direct.rate), source: "direct" };

  // 2) reverse (use reciprocal if only quote->base exists)
  const rev = findDirect(quote, base, onDate);
  if (rev) return { rate: 1 / Number(rev.rate), source: "reverse" as any };

  // 3) triangulate via default pivot AED
  const PIVOT = "AED";
  if (base !== PIVOT && quote !== PIVOT) {
    const leg1 = getBestRate(base, PIVOT, onDate);
    const leg2 = getBestRate(PIVOT, quote, onDate);
    if (leg1 && leg2) {
      return { rate: leg1.rate * leg2.rate, source: "triangulated" };
    }
  }

  return null;
}

// --- Handlers ---------------------------------------------------------------

export async function GET() {
  try {
    const rows = db.select().from(transfer).all();
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { date, fromAccountId, toAccountId, amountFromMinor, note } = body as {
      date?: string;
      fromAccountId?: string;
      toAccountId?: string;
      amountFromMinor?: number; // positive integer in FROM account currency
      note?: string;
    };

    if (!date || !fromAccountId || !toAccountId || amountFromMinor == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const amt = Number(amountFromMinor);
    if (!Number.isInteger(amt) || amt <= 0) {
      return NextResponse.json({ error: "amountFromMinor must be a positive integer" }, { status: 400 });
    }
    if (fromAccountId === toAccountId) {
      return NextResponse.json({ error: "fromAccountId and toAccountId must differ" }, { status: 400 });
    }

    const fromAcc = db.select().from(account).where(eq(account.id, fromAccountId)).get();
    const toAcc = db.select().from(account).where(eq(account.id, toAccountId)).get();
    if (!fromAcc || !toAcc) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const fromCcy = fromAcc.currencyCode;
    const toCcy = toAcc.currencyCode;

    // FX lookup (improved: <= date, reverse, triangulate via AED)
    let rate = 1;
    let fxSource: "same_currency" | "direct" | "reverse" | "triangulated" | "missing_1_1" = "same_currency";

    if (fromCcy !== toCcy) {
      const r = getBestRate(fromCcy, toCcy, date);
      if (r) {
        rate = r.rate;
        fxSource = r.source;
      } else {
        rate = 1;
        fxSource = "missing_1_1"; // mark pending (UI can show as pending)
      }
    }

    // convert to target currency minor units
    const amountToMinor = Math.round(amt * rate);

    const id = ulid();
    const nowIso = new Date().toISOString();
    const row = {
      id,
      date,
      postingKind: "acct_to_acct" as const,
      fromAccountId,
      toAccountId,
      amountFromMinor: amt,
      currencyFromCode: fromCcy,
      amountToMinor,
      currencyToCode: toCcy,
      fxRateUsed: rate,
      fxSource,
      note: note ?? null,
      status: "posted" as const,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    db.insert(transfer).values(row as any).run();
    return NextResponse.json(row, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}