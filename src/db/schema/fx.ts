import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";

// Simple policy (1 row optional, for defaults)
export const fxPolicy = sqliteTable("fx_policy", {
  id: integer("id").primaryKey().default(1),          // always 1
  baseCurrencyCode: text("base_currency_code"),       // optional info
  roundingMode: text("rounding_mode").default("ROUND_HALF_UP"),
  triangulationEnabled: integer("triangulation_enabled", { mode: "boolean" })
    .notNull().default(true),
  createdAt: text("created_at").default("now"),
  updatedAt: text("updated_at").default("now"),
});

// Daily rates for a pair (A -> B)
export const fxRate = sqliteTable("fx_rate", {
  id: text("id").primaryKey(),                        // ULID
  fromCode: text("from_code").notNull(),              // e.g., "AED"
  toCode: text("to_code").notNull(),                  // e.g., "USD"
  rate: real("rate").notNull(),                       // multiply from -> to
  effectiveDate: text("effective_date").notNull(),    // "YYYY-MM-DD"
  source: text("source").notNull().default("manual"), // manual|import|provider
  note: text("note"),
  createdAt: text("created_at").default("now"),
  updatedAt: text("updated_at").default("now"),
});