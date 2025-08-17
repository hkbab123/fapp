import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { paymentCard } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ulid } from "ulid";

// GET /api/payment-cards?accountId=...   -> list cards (optionally for one account)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");

  if (accountId) {
    const rows = db.select().from(paymentCard).where(eq(paymentCard.accountId, accountId)).all();
    return NextResponse.json(rows);
  }

  const rows = db.select().from(paymentCard).all();
  return NextResponse.json(rows);
}

// POST /api/payment-cards   -> register a new card (metadata only)
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const {
    accountId,
    cardType,        // e.g. "visa.debit.std" (optional)
    network,         // "visa" | "mastercard" | "amex" | "rupay" | "other" (optional)
    nameOnCard,      // optional
    expiryMonth,     // 1..12 (optional)
    expiryYear,      // 2000..2100 (optional)
    panLast4,        // EXACTLY 4 digits (optional)
    issuerRef,       // optional
  } = b as any;

  if (!accountId) {
    return NextResponse.json({ error: "accountId is required" }, { status: 400 });
  }
  if (panLast4 && !/^\d{4}$/.test(String(panLast4))) {
    return NextResponse.json({ error: "panLast4 must be exactly 4 digits" }, { status: 400 });
  }
  if (expiryMonth != null) {
    const m = Number(expiryMonth);
    if (Number.isNaN(m) || m < 1 || m > 12) {
      return NextResponse.json({ error: "expiryMonth must be 1..12" }, { status: 400 });
    }
  }
  if (expiryYear != null) {
    const y = Number(expiryYear);
    if (Number.isNaN(y) || y < 2000 || y > 2100) {
      return NextResponse.json({ error: "expiryYear must be 2000..2100" }, { status: 400 });
    }
  }

  const id = ulid();
  db.insert(paymentCard).values({
    id,
    accountId,
    cardType: cardType ?? null,
    network: network ?? null,
    nameOnCard: nameOnCard ?? null,
    expiryMonth: expiryMonth ?? null,
    expiryYear: expiryYear ?? null,
    panLast4: panLast4 ?? null,
    issuerRef: issuerRef ?? null,
    archived: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }).run();

  const row = db.select().from(paymentCard).where(eq(paymentCard.id, id)).get();
  return NextResponse.json(row, { status: 201 });
}