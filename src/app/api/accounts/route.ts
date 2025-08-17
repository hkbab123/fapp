import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { account } from "@/db/schema"; // matches your schema export
import { and, asc, eq } from "drizzle-orm";

/**
 * GET /api/accounts
 * Optional query params:
 *   archived=0|1   (default 0)
 *   currencyCode=AED|USD|... (optional)
 */
export async function GET() {
  try {
    const data = await db
      .select()
      .from(account)
      .where(eq(account.archived, 0)); // only active accounts
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("GET /api/accounts error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/**
 * POST /api/accounts
 * Body: { name, type, currencyCode, openingBalanceMinor?, openingDate?, institutionName?, notes? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body?.name || !body?.type || !body?.currencyCode) {
      return NextResponse.json(
        { error: "name, type and currencyCode are required" },
        { status: 400 }
      );
    }

    const [row] = await db
      .insert(account)
      .values({
        name: String(body.name),
        type: String(body.type),
        currencyCode: String(body.currencyCode),
        openingBalanceMinor:
          body.openingBalanceMinor != null ? Number(body.openingBalanceMinor) : 0,
        openingDate: body.openingDate ?? null,
        institutionName: body.institutionName ?? null,
        notes: body.notes ?? null,
        archived: 0,
      })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/accounts error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}