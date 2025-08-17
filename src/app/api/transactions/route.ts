import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transaction, account, category, categoryGroup, fxRate } from "@/db/schema";
import { ulid } from "ulid";
import { eq, and } from "drizzle-orm";

// GET: list all transactions (simple)
export async function GET() {
  try {
    const rows = db.select().from(transaction).all();
    return NextResponse.json(rows);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}

// POST: create Acct→Category transaction with FX support
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { date, accountId, categoryId, amountMinor, typeLabel, note } = body as {
      date?: string;
      accountId?: string;
      categoryId?: string;
      amountMinor?: number;
      typeLabel?: "expense" | "income";
      note?: string;
    };

    // Validate
    if (!date || !accountId || !categoryId || amountMinor == null || !typeLabel) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const amt = Number(amountMinor);
    if (!Number.isInteger(amt) || amt <= 0) {
      return NextResponse.json({ error: "amountMinor must be a positive integer" }, { status: 400 });
    }

    // Source currency from Account (ignore any currencyCode sent by client)
    const acct = db.select().from(account).where(eq(account.id, accountId)).get();
    if (!acct) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    const srcCcy = acct.currencyCode;

    // Target currency from Category's group
    const cat = db.select().from(category).where(eq(category.id, categoryId)).get();
    if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    const grp = db.select().from(categoryGroup).where(eq(categoryGroup.id, cat.groupId)).get();
    const tgtCcy = (cat as any).currencyCode ?? grp?.currencyCode ?? srcCcy;

    // FX (src -> tgt) at given date
    let fx = 1;
    let fxSource = "same_currency";
    if (srcCcy !== tgtCcy) {
      const r = db
        .select()
        .from(fxRate)
        .where(and(eq(fxRate.fromCode, srcCcy), eq(fxRate.toCode, tgtCcy), eq(fxRate.effectiveDate, date)))
        .get();
      if (r) {
        fx = Number(r.rate);
        fxSource = "rate_found";
      } else {
        fx = 1;
        fxSource = "missing_1_1";
      }
    }
    const catAmt = Math.round(amt * fx);

    // Insert ONLY DB columns (do not include _fx)
    const id = ulid();
    const dbRow = {
      id,
      date,
      postingKind: "acct_to_category" as const,
      typeLabel,
      accountId,
      categoryId,
      amountMinor: amt,
      currencyCode: srcCcy,
      categoryAmountMinor: catAmt,
      categoryCurrencyCode: tgtCcy,
      note: note ?? null,
      status: "posted" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.insert(transaction).values(dbRow as any).run();

    // Return JSON + FX meta (FX meta NOT stored)
    return NextResponse.json({ ...dbRow, _fx: { from: srcCcy, to: tgtCcy, rate: fx, source: fxSource } }, { status: 201 });
  } catch (err: any) {
    // Ensure the client always gets valid JSON
    return NextResponse.json({ error: err?.message ?? "Server error" }, { status: 500 });
  }
}