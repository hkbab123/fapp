import { NextResponse } from "next/server";
import { db } from "@/db";
import { institution } from "@/db/schema";

export async function GET() {
  const rows = db.select().from(institution).all();
  return NextResponse.json(rows);
}