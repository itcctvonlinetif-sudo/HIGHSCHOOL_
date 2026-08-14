import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const prayerTimesTable = pgTable("prayer_times", {
  id: serial("id").primaryKey(),
  fajr: text("fajr").notNull().default("04:45"),
  dhuhr: text("dhuhr").notNull().default("12:00"),
  asr: text("asr").notNull().default("15:15"),
  maghrib: text("maghrib").notNull().default("18:05"),
  isha: text("isha").notNull().default("19:15"),
  jumuah: text("jumuah").notNull().default("12:00"),
  updatedAt: text("updated_at"),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
