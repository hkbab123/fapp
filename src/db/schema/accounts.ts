import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { currency, accountType } from "./registry";

/** Account (unchanged) **/
export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type").notNull().references(() => accountType.code),
  currencyCode: text("currency_code").notNull().references(() => currency.code),
  openingBalanceMinor: integer("opening_balance_minor").notNull().default(0),
  openingDate: text("opening_date"),
  institutionId: text("institution_id"),
  institutionName: text("institution_name"),
  accountRef: text("account_ref"),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  notes: text("notes"),
  createdAt: text("created_at").default("now"),
  updatedAt: text("updated_at").default("now")
});

/** BankingIdentifiers (unchanged) **/
export const bankingIdentifiers = sqliteTable("banking_identifiers", {
  accountId: text("account_id").primaryKey().references(() => account.id),
  accountNumberMasked: text("account_number_masked"),
  iban: text("iban"),
  swiftBic: text("swift_bic"),
  branch: text("branch"),
  abbr: text("abbr"),
  createdAt: text("created_at").default("now"),
  updatedAt: text("updated_at").default("now")
});

/** PaymentCard — single source of truth **/
export const paymentCard = sqliteTable("payment_card", {
  id: text("id").primaryKey(),                 // ULID
  accountId: text("account_id").notNull().references(() => account.id),
  cardTypeCode: text("card_type_code"),        // optional registry code
  network: text("network"),                    // visa|mastercard|amex|rupay|other
  nameOnCard: text("name_on_card"),
  expiryMonth: integer("expiry_month"),
  expiryYear: integer("expiry_year"),
  panLast4: text("pan_last4"),                 // exactly 4 digits (UI/API validated)
  issuerRef: text("issuer_ref"),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").default("now"),
  updatedAt: text("updated_at").default("now")
});