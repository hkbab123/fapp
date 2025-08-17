import { NextResponse } from "next/server";
import { db } from "@/db";
import { currency, accountType } from "@/db/schema";

export async function POST() {
  db.insert(currency).values([
    { code: "AED", name: "UAE Dirham", decimalDigits: 2, enabled: 1 },
    { code: "USD", name: "US Dollar", decimalDigits: 2, enabled: 1 },
    { code: "INR", name: "Indian Rupee", decimalDigits: 2, enabled: 1 },
    { code: "AUD", name: "Australian Dollar", decimalDigits: 2, enabled: 1 },
  ]).run();

  db.insert(accountType).values([
    { code: "asset.cash", name: "Cash", nature: "asset", enabled: 1 },
    { code: "asset.bank.checking", name: "Bank - Checking", nature: "asset", enabled: 1 },
    { code: "asset.bank.savings", name: "Bank - Savings", nature: "asset", enabled: 1 },
    { code: "asset.mobile_wallet", name: "Mobile Wallet", nature: "asset", enabled: 1 },
    { code: "liability.credit_card", name: "Credit Card", nature: "liability", enabled: 1 },
    { code: "liability.loan", name: "Loan", nature: "liability", enabled: 1 },
  ]).run();

  return NextResponse.json({ ok: true });
}
