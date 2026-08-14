import { pgTable, text, serial, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const layananTable = pgTable("layanan", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull().default("BookOpen"),
  linkUrl: text("link_url"),
  order: integer("order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),

  popupEnabled: boolean("popup_enabled").notNull().default(false),
  popupTitle: text("popup_title"),
  popupSubtitle: text("popup_subtitle"),
  popupImageUrl: text("popup_image_url"),
  popupInstructions: text("popup_instructions"),
  popupHighlightTitle: text("popup_highlight_title"),
  popupHighlightContent: text("popup_highlight_content"),
});

export const insertLayananSchema = createInsertSchema(layananTable).omit({ id: true });
export type InsertLayanan = z.infer<typeof insertLayananSchema>;
export type Layanan = typeof layananTable.$inferSelect;
