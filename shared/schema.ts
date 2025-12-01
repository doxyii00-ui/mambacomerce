import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
});

export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  productId: text("product_id").notNull(),
  productName: text("product_name").notNull(),
  price: text("price").notNull(),
  stripeSessionId: text("stripe_session_id").unique(),
  status: text("status").notNull().default("pending"), // pending, paid, failed
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const discordAccess = pgTable("discord_access", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  discordUserId: text("discord_user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const obywatelForms = pgTable("obywatel_forms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  orderId: text("order_id").notNull(),
  formData: jsonb("form_data").notNull(),
  accessLink: text("access_link"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  submittedAt: timestamp("submitted_at"),
});

export const accessCodes = pgTable("access_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(),
  productType: text("product_type").notNull(), // "obywatel" or "receipts"
  email: text("email"),
  orderId: text("order_id"),
  isUsed: text("is_used").notNull().default("false"),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
}).extend({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  status: true,
}).extend({
  email: z.string().email("Invalid email address"),
  productId: z.string().min(1, "Product ID required"),
});

export const insertDiscordAccessSchema = createInsertSchema(discordAccess).omit({
  id: true,
  createdAt: true,
}).extend({
  email: z.string().email("Invalid email address"),
  discordUserId: z.string().min(1, "Discord User ID required"),
  expiresAt: z.date(),
});

export const insertObywatelFormSchema = createInsertSchema(obywatelForms).omit({
  id: true,
  createdAt: true,
  submittedAt: true,
}).extend({
  email: z.string().email("Invalid email address"),
  orderId: z.string().min(1, "Order ID required"),
  formData: z.record(z.any()),
  accessLink: z.string().optional(),
});

export const insertAccessCodeSchema = createInsertSchema(accessCodes).omit({
  id: true,
  createdAt: true,
  usedAt: true,
  isUsed: true,
}).extend({
  code: z.string().min(1, "Code required"),
  productType: z.enum(["obywatel", "receipts"]),
  email: z.string().email("Invalid email address").optional(),
  orderId: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertDiscordAccess = z.infer<typeof insertDiscordAccessSchema>;
export type DiscordAccess = typeof discordAccess.$inferSelect;
export type InsertObywatelForm = z.infer<typeof insertObywatelFormSchema>;
export type ObywatelForm = typeof obywatelForms.$inferSelect;
export type InsertAccessCode = z.infer<typeof insertAccessCodeSchema>;
export type AccessCode = typeof accessCodes.$inferSelect;
