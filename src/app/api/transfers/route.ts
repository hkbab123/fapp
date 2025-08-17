import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { account, fxRate, transfer } from "@/db/schema";
import { ulid } from "ulid";
import { eq, and } from "drizzle-orm";

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

    // FX lookup
    let rate = 1;
    let fxSource = "same_currency";
    if (fromCcy !== toCcy) {
      const r = db.select().from(fxRate)
        .where(and(eq(fxRate.fromCode, fromCcy), eq(fxRate.toCode, toCcy), eq(fxRate.effectiveDate, date)))
        .get();
      if (r) {
        rate = Number(r.rate);
        fxSource = "rate_found";
      } else {
        rate = 1;                  // simple fallback
        fxSource = "missing_1_1";
      }
    }

    const amountToMinor = Math.round(amt * rate);

    const id = ulid();
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.insert(transfer).values(row as any).run();
    return NextResponse.json(row, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}