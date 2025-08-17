import { NextResponse } from "next/server";
import { db } from "@/db";
import { categoryGroup } from "@/db/schema";

export async function GET() {
  const rows = db.select().from(categoryGroup).all();
  return NextResponse.json(rows);
}