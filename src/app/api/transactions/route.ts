import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transaction } from "@/db/schema"; // ✅ singular
import { asc } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select({
      id: transaction.id,
      date: transaction.date,
      typeLabel: transaction.typeLabel,
      accountId: transaction.accountId,
      categoryId: transaction.categoryId,
      amountMinor: transaction.amountMinor,
      currencyCode: transaction.currencyCode,
      note: transaction.note,
    })
    .from(transaction)
    .orderBy(asc(transaction.date), asc(transaction.id));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      date,
      accountId,
      categoryId,
      amountMinor,
      typeLabel,
      note,
    } = body;

    if (!date || !accountId || !categoryId || !amountMinor || amountMinor <= 0 || !typeLabel) {
      return NextResponse.json({ error: "Missing/invalid fields" }, { status: 400 });
    }

    const [row] = await db
      .insert(transaction)
      .values({
        date,
        accountId,
        categoryId,
        amountMinor,
        typeLabel,
        note: note ?? null,
      })
      .returning({ id: transaction.id });

    return NextResponse.json({ id: row.id }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Create failed" }, { status: 500 });
  }
}