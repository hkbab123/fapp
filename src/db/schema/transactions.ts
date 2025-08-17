import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

/**
 * Minimal transaction for Acct → Category
 * - single posting date
 * - positive minor units
 * - we’ll add splits & transfers later
 */
export const transaction = sqliteTable("txn", {
  id: text("id").primaryKey(),                 // ULID
  date: text("date").notNull(),                // YYYY-MM-DD
  postingKind: text("posting_kind").notNull(), // "acct_to_category"
  typeLabel: text("type_label").notNull(),     // "expense" | "income"

  // acct → category
  accountId: text("account_id").notNull(),
  categoryId: text("category_id").notNull(),
  amountMinor: integer("amount_minor").notNull(),       // in account currency
  currencyCode: text("currency_code").notNull(),        // account currency
  categoryAmountMinor: integer("category_amount_minor").notNull(), // for now = amountMinor
  categoryCurrencyCode: text("category_currency_code").notNull(),  // for now = currencyCode

  note: text("note"),
  tags: text("tags"), // JSON string array (later)
  status: text("status").notNull().default("posted"), // posted|planned|skipped|canceled
  createdAt: text("created_at").default("now"),
  updatedAt: text("updated_at").default("now"),
});