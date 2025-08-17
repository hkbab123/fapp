import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const currency = sqliteTable("currency", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  decimalDigits: integer("decimal_digits").notNull().default(2),
  symbol: text("symbol"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
});

export const accountType = sqliteTable("account_type", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  nature: text("nature").notNull(), // asset | liability | other
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
});
// --- Institution (registry)
export const institution = sqliteTable("institution", {
  id: text("id").primaryKey(),          // ULID
  name: text("name").notNull().unique(),
  country: text("country"),
  abbr: text("abbr"),
  website: text("website"),
  supportPhone: text("support_phone"),
  notes: text("notes"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").default("now"),
  updatedAt: text("updated_at").default("now"),
});

// --- CardType (registry)
export const cardType = sqliteTable("card_type", {
  code: text("code").primaryKey(),      // e.g. visa.debit.std
  name: text("name").notNull(),
  network: text("network").notNull(),   // visa|mastercard|amex|rupay|other
  category: text("category"),           // debit|credit|prepaid
  issuerInstitutionId: text("issuer_institution_id"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  displayOrder: integer("display_order"),
  createdAt: text("created_at").default("now"),
  updatedAt: text("updated_at").default("now"),
});