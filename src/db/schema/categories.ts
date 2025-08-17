import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { currency } from "./registry";

export const categoryGroup = sqliteTable("category_group", {
  id: text("id").primaryKey(),          // ULID
  name: text("name").notNull().unique(),// country-level group
  countryCode: text("country_code"),
  currencyCode: text("currency_code").notNull().references(() => currency.code),
  displayOrder: integer("display_order"),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").default("now"),
  updatedAt: text("updated_at").default("now"),
});

export const category = sqliteTable("category", {
  id: text("id").primaryKey(),          // ULID
  groupId: text("group_id").notNull().references(() => categoryGroup.id),
  parentId: text("parent_id"),
  path: text("path"),                    // derived
  depth: integer("depth").notNull(),     // ≤ 4
  name: text("name").notNull(),
  code: text("code"),                    // unique per group if set
  type: text("type").notNull(),          // expense|income|saving|liability|transfer_special
  currencyCode: text("currency_code"),   // inherits when null
  defaultJarId: text("default_jar_id"),
  color: text("color"),
  icon: text("icon"),
  displayOrder: integer("display_order"),
  archived: integer("archived", { mode: "boolean" }).notNull().default(false),
  notes: text("notes"),
  createdAt: text("created_at").default("now"),
  updatedAt: text("updated_at").default("now"),
});