import { NextResponse } from "next/server";
import { db } from "@/db";
import { institution, cardType } from "@/db/schema";
import { ulid } from "ulid";

export async function POST() {
  // Institutions (a few examples)
  const inst = [
    { id: ulid(), name: "HSBC UAE", country: "AE", abbr: "HSBC" },
    { id: ulid(), name: "Emirates NBD", country: "AE", abbr: "ENBD" },
    { id: ulid(), name: "HDFC Bank", country: "IN", abbr: "HDFC" },
  ];
  inst.forEach((x) => db.insert(institution).values({
    ...x, enabled: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }).run());

  // Card types (examples)
  const cards = [
    { code: "visa.debit.std",      name: "Visa Debit",      network: "visa",       category: "debit"  },
    { code: "mc.credit.std",       name: "Mastercard Credit", network: "mastercard", category: "credit" },
    { code: "amex.credit.std",     name: "Amex Credit",     network: "amex",       category: "credit" },
    { code: "rupay.debit.std",     name: "RuPay Debit",     network: "rupay",      category: "debit"  },
  ];
  cards.forEach((c) => db.insert(cardType).values({
    ...c, enabled: 1, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }).run());

  return NextResponse.json({ ok: true, institutions: inst.length, cardTypes: cards.length });
}