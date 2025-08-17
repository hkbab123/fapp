import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { account } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id;
    const body = await req.json().catch(() => ({}));

    // Allowed updates (keep minimal & safe)
    const patch: any = {};
    if ("name" in body) patch.name = String(body.name);
    if ("notes" in body) patch.notes = body.notes == null ? null : String(body.notes);
    if ("archived" in body) patch.archived = body.archived ? 1 : 0;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "No updatable fields found" }, { status: 400 });
    }

    patch.updatedAt = new Date().toISOString();

    db.update(account).set(patch).where(eq(account.id, id)).run();
    const updated = db.select().from(account).where(eq(account.id, id)).get();
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}