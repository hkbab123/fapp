import { NextResponse } from "next/server";
import { db } from "@/db";
import { accountType } from "@/db/schema";

export async function GET() {
  try {
    const rows = db.select().from(accountType).all();
    return NextResponse.json(rows);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}