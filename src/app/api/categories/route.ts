import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { category, categoryGroup } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { ulid } from "ulid";

// GET /api/categories?groupId=ID
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const groupId = searchParams.get("groupId");
    if (!groupId) {
      // return all if no filter (handy for maintenance)
      const rows = db.select().from(category).all();
      return NextResponse.json(rows);
    }
    const rows = db
      .select()
      .from(category)
      .where(eq(category.groupId, groupId))
      .all();
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

// POST /api/categories
// body: { groupId, name, type?, parentId? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { groupId, name } = body as { groupId?: string; name?: string };
    let { type, parentId } = body as { type?: string; parentId?: string | null };

    if (!groupId || !name) {
      return NextResponse.json({ error: "groupId and name are required" }, { status: 400 });
    }

    // group must exist
    const grp = db.select().from(categoryGroup).where(eq(categoryGroup.id, groupId)).get();
    if (!grp) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    let depth = 2; // group roots live at depth 2 in our UI
    let effectiveType = type as
      | "expense" | "income" | "saving" | "liability" | "transfer_special" | undefined;

    // If parentId provided, we **inherit type from the parent** and set depth accordingly.
    if (parentId) {
      const parent = db
        .select()
        .from(category)
        .where(and(eq(category.id, parentId), eq(category.groupId, groupId)))
        .get();
      if (!parent) return NextResponse.json({ error: "Parent not found in this group" }, { status: 400 });
      effectiveType = parent.type as any;        // always parent’s type
      depth = (parent.depth ?? 2) + 1;
    } else {
      // root: need explicit type
      if (!effectiveType) {
        return NextResponse.json({ error: "type is required for a root category" }, { status: 400 });
      }
    }

    const id = ulid();
    const now = new Date().toISOString();
    db.insert(category).values({
      id,
      groupId,
      parentId: parentId ?? null,
      name,
      type: effectiveType as any,
      depth,
      displayOrder: null,
      archived: 0,
      createdAt: now,
      updatedAt: now,
      // category.currencyCode may be null → use group currency at read time
    } as any).run();

    const created = db.select().from(category).where(eq(category.id, id)).get();
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}