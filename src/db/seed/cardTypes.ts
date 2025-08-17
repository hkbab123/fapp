import { db } from "@/db";
import { cardType } from "@/db/schema/card";

export async function seedCardTypes() {
  const rows = [
    { code: "visa.debit.standard", name: "Visa Debit", network: "visa", category: "debit" },
    { code: "visa.credit.standard", name: "Visa Credit", network: "visa", category: "credit" },
    { code: "mastercard.debit.standard", name: "Mastercard Debit", network: "mastercard", category: "debit" },
    { code: "mastercard.credit.standard", name: "Mastercard Credit", network: "mastercard", category: "credit" },
    { code: "amex.credit", name: "American Express", network: "amex", category: "credit" },
  ];
  for (const r of rows) db.insert(cardType).values(r as any).onConflictDoNothing().run();
}