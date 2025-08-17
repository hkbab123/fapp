import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
// ⬇️ If your table is named differently, adjust this import
import { transfers } from "@/db/schema";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params?.id;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await db.delete(transfers).where(eq(transfers.id, id));
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed to delete transfer" }, { status: 500 });
  }
}