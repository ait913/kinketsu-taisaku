import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema.js";

export * from "./auth-schema.js";

export const category = sqliteTable("category", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  signMode: text("sign_mode", { enum: ["income", "expense", "free"] }).notNull().default("free"),
  isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
}, (t) => [
  index("category_user_idx").on(t.userId),
]);

export const tag = sqliteTable("tag", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").notNull().references(() => category.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  color: text("color"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
}, (t) => [
  index("tag_user_idx").on(t.userId),
  index("tag_category_idx").on(t.categoryId),
]);

export const recurringRule = sqliteTable("recurring_rule", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  dayOfMonth: integer("day_of_month").notNull(),
  signedAmount: integer("signed_amount").notNull(),
  categoryId: integer("category_id").notNull().references(() => category.id, { onDelete: "restrict" }),
  tagId: integer("tag_id").references(() => tag.id, { onDelete: "restrict" }),
  description: text("description").notNull().default(""),
  startMonth: text("start_month").notNull(),
  endMonth: text("end_month"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
}, (t) => [
  index("recurring_rule_user_idx").on(t.userId),
]);

export const record = sqliteTable("record", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  yearMonth: text("year_month").notNull(),
  signedAmount: integer("signed_amount").notNull(),
  categoryId: integer("category_id").notNull().references(() => category.id, { onDelete: "restrict" }),
  tagId: integer("tag_id").references(() => tag.id, { onDelete: "restrict" }),
  description: text("description").notNull().default(""),
  paid: integer("paid", { mode: "boolean" }).notNull().default(true),
  sourceRuleId: integer("source_rule_id").references(() => recurringRule.id, { onDelete: "set null" }),
  isManuallyEdited: integer("is_manually_edited", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
}, (t) => [
  index("record_user_ym_idx").on(t.userId, t.yearMonth),
  index("record_user_date_idx").on(t.userId, t.date),
  index("record_source_rule_idx").on(t.sourceRuleId),
  unique("record_rule_ym_uq").on(t.sourceRuleId, t.yearMonth),
]);

export const anchor = sqliteTable("anchor", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  balance: integer("balance").notNull().default(0),
  asOf: text("as_of").notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

export const settings = sqliteTable("settings", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  materializeMonths: integer("materialize_months").notNull().default(12),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

export const categoryRelations = relations(category, ({ many }) => ({
  tags: many(tag),
  records: many(record),
  rules: many(recurringRule),
}));

export const tagRelations = relations(tag, ({ one, many }) => ({
  category: one(category, { fields: [tag.categoryId], references: [category.id] }),
  records: many(record),
  rules: many(recurringRule),
}));

export const recordRelations = relations(record, ({ one }) => ({
  category: one(category, { fields: [record.categoryId], references: [category.id] }),
  tag: one(tag, { fields: [record.tagId], references: [tag.id] }),
  rule: one(recurringRule, { fields: [record.sourceRuleId], references: [recurringRule.id] }),
}));

export const recurringRuleRelations = relations(recurringRule, ({ one, many }) => ({
  category: one(category, { fields: [recurringRule.categoryId], references: [category.id] }),
  tag: one(tag, { fields: [recurringRule.tagId], references: [tag.id] }),
  records: many(record),
}));
