import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transfer } from "@/db/schema"; // adjust if your table is named differently
import { eq } from "drizzle-orm";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await db.delete(transfer).where(eq(transfer.id, id));
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Delete failed" }, { status: 500 });
  }
}