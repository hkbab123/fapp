import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transaction } from "@/db/schema"; // <-- singular
import { eq } from "drizzle-orm";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.delete(transaction).where(eq(transaction.id, params.id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to delete transaction" }, { status: 500 });
  }
}