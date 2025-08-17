import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const transfer = sqliteTable("txn_transfer", {
  id: text("id").primaryKey(),                     // ULID
  date: text("date").notNull(),                    // YYYY-MM-DD
  postingKind: text("posting_kind").notNull(),     // "acct_to_acct"

  fromAccountId: text("from_account_id").notNull(),
  toAccountId: text("to_account_id").notNull(),

  amountFromMinor: integer("amount_from_minor").notNull(), // in from-account currency
  currencyFromCode: text("currency_from_code").notNull(),

  amountToMinor: integer("amount_to_minor").notNull(),     // in to-account currency
  currencyToCode: text("currency_to_code").notNull(),

  fxRateUsed: real("fx_rate_used"),                // from -> to (for that date)
  fxSource: text("fx_source"),                     // rate_found | missing_1_1 | same_currency

  note: text("note"),
  status: text("status").notNull().default("posted"), // posted|planned|canceled

  createdAt: text("created_at").default("now"),
  updatedAt: text("updated_at").default("now"),
});