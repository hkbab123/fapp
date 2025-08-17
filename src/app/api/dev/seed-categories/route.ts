import { NextResponse } from "next/server";
import { db } from "@/db";
import { categoryGroup, category } from "@/db/schema";
import { ulid } from "ulid";
import { eq } from "drizzle-orm";

async function getOrCreateGroup(name: string, countryCode: string, currencyCode: string) {
  const existing = db.select().from(categoryGroup).where(eq(categoryGroup.name, name)).get();
  if (existing) return existing.id;
  const id = ulid();
  db.insert(categoryGroup).values({
    id, name, countryCode, currencyCode, archived: 0,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }).run();
  return id;
}

function addCat(groupId: string, parentId: string | null, depth: number, name: string, type: string, code?: string) {
  const id = ulid();
  const path = parentId ? `${parentId}/${id}` : id;
  db.insert(category).values({
    id, groupId, parentId: parentId ?? undefined, path, depth, name, type,
    code, archived: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }).run();
  return id;
}

export async function POST() {
  // UAE (AED)
  const uaeId = await getOrCreateGroup("UAE", "AE", "AED");
  // reserved transfer_special (read-only in UI later)
  addCat(uaeId, null, 2, "transfer_special", "transfer_special", "transfer_special");
  const expUAE = addCat(uaeId, null, 2, "Expense", "expense");
  addCat(uaeId, expUAE, 3, "Groceries", "expense");
  addCat(uaeId, expUAE, 3, "Utilities", "expense");
  const incUAE = addCat(uaeId, null, 2, "Income", "income");
  addCat(uaeId, incUAE, 3, "Salary", "income");
  const savUAE = addCat(uaeId, null, 2, "Saving", "saving");
  addCat(uaeId, savUAE, 3, "Emergency Fund", "saving");
  const liaUAE = addCat(uaeId, null, 2, "Liability", "liability");
  addCat(uaeId, liaUAE, 3, "Credit Card Payment", "liability");

  // India (INR)
  const indId = await getOrCreateGroup("India", "IN", "INR");
  addCat(indId, null, 2, "transfer_special", "transfer_special", "transfer_special");
  const expIN = addCat(indId, null, 2, "Expense", "expense");
  addCat(indId, expIN, 3, "Groceries", "expense");
  const incIN = addCat(indId, null, 2, "Income", "income");
  addCat(indId, incIN, 3, "Salary", "income");
  // USA (USD)
  const usaId = await getOrCreateGroup("USA", "US", "USD");
  addCat(usaId, null, 2, "transfer_special", "transfer_special", "transfer_special");
  const expUS = addCat(usaId, null, 2, "Expense", "expense");
  addCat(usaId, expUS, 3, "Groceries", "expense");
  const incUS = addCat(usaId, null, 2, "Income", "income");
  addCat(usaId, incUS, 3, "Salary", "income");
  const savUS = addCat(usaId, null, 2, "Saving", "saving");
  addCat(usaId, savUS, 3, "Emergency Fund", "saving");
  const liaUS = addCat(usaId, null, 2, "Liability", "liability");
  addCat(usaId, liaUS, 3, "Credit Card Payment", "liability");

  return NextResponse.json({ ok: true });
}