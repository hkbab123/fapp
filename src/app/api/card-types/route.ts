import { NextResponse } from "next/server";
import { db } from "@/db";
import { cardType } from "@/db/schema";

export async function GET() {
  const rows = db.select().from(cardType).all();
  return NextResponse.json(rows);
}