import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { fxRate } from "@/db/schema";
import { ulid } from "ulid";
import { and, eq } from "drizzle-orm";

// GET /api/fx-rates?from=AED&to=USD&date=2025-08-16
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const date = searchParams.get("date");

  if (from && to && date) {
    // one exact rate for a day
    const row = db.select().from(fxRate)
      .where(and(eq(fxRate.fromCode, from), eq(fxRate.toCode, to), eq(fxRate.effectiveDate, date)))
      .get?.();
    return NextResponse.json(row ?? null);
  }

  const rows = db.select().from(fxRate).all();
  return NextResponse.json(rows);
}

// POST /api/fx-rates
// { "fromCode":"AED", "toCode":"USD", "rate":0.272294, "effectiveDate":"2025-08-16", "source":"manual" }
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const { fromCode, toCode, rate, effectiveDate, source, note } = b as {
    fromCode?: string; toCode?: string; rate?: number; effectiveDate?: string; source?: string; note?: string;
  };
  if (!fromCode || !toCode || !rate || !effectiveDate) {
    return NextResponse.json({ error: "fromCode, toCode, rate, effectiveDate are required" }, { status: 400 });
  }
  const id = ulid();
  db.insert(fxRate).values({
    id,
    fromCode,
    toCode,
    rate: Number(rate),
    effectiveDate,
    source: source ?? "manual",
    note: note ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }).run();
  const row = db.select().from(fxRate).where(eq(fxRate.id, id)).get?.();
  return NextResponse.json(row ?? { id }, { status: 201 });
}