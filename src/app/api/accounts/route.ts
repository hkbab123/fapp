import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { account, accountType, currency } from "@/db/schema";
import { ulid } from "ulid";
import { eq } from "drizzle-orm";

// GET /api/accounts  -> list all accounts
export async function GET() {
  try {
    const rows = db.select().from(account).all();
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}

// POST /api/accounts  -> create account
// { name, type, currencyCode, openingBalanceMinor?, openingDate?, institutionName? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      name,
      type,
      currencyCode,
      openingBalanceMinor,
      openingDate,
      institutionName,
      notes,
      accountRef,
    } = body as Partial<{
      name: string;
      type: string;
      currencyCode: string;
      openingBalanceMinor: number;
      openingDate: string;
      institutionName: string;
      notes: string;
      accountRef: string;
    }>;

    // basic validation
    if (!name || !type || !currencyCode) {
      return NextResponse.json({ error: "name, type, currencyCode are required" }, { status: 400 });
    }

    // validate registry values exist
    const at = db.select().from(accountType).where(eq(accountType.code, type)).get();
    if (!at) return NextResponse.json({ error: `Unknown account type: ${type}` }, { status: 400 });

    const cc = db.select().from(currency).where(eq(currency.code, currencyCode)).get();
    if (!cc) return NextResponse.json({ error: `Unknown currency: ${currencyCode}` }, { status: 400 });

    // insert
    const id = ulid();
    const row = {
      id,
      name,
      type,
      currencyCode,
      openingBalanceMinor: Number.isFinite(openingBalanceMinor as number)
        ? Number(openingBalanceMinor)
        : 0,
      openingDate: openingDate ?? null,
      institutionId: null as string | null,
      institutionName: institutionName ?? null,
      accountRef: accountRef ?? null,
      archived: 0,
      notes: notes ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.insert(account).values(row as any).run();

    // return created row
    const created = db.select().from(account).where(eq(account.id, id)).get();
    return NextResponse.json(created, { status: 201 });
  } catch (e: any) {
    // handle unique name violation or other DB errors cleanly
    const msg = typeof e?.message === "string" ? e.message : "Server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}