import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { category } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Block delete if it has children
    const children = db
      .select({ id: category.id })
      .from(category)
      .where(eq(category.parentId, id))
      .all();
    if (children.length) {
      return NextResponse.json(
        { error: "Cannot delete: category has children" },
        { status: 400 }
      );
    }

    // Hard delete (use update archived=1 if you prefer soft delete)
    db.delete(category).where(eq(category.id, id)).run();

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json().catch(() => ({}));
    const { archived } = body as { archived?: boolean };

    if (typeof archived !== "boolean") {
      return NextResponse.json({ error: "archived: boolean required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    db.update(category)
      .set({ archived: archived ? 1 : 0, updatedAt: now })
      .where(eq(category.id, id))
      .run();

    const updated = db.select().from(category).where(eq(category.id, id)).get();
    return NextResponse.json(updated);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}