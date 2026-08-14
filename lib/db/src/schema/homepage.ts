import { pgTable, text, serial, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const homepageSectionsTable = pgTable("homepage_sections", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  isVisible: boolean("is_visible").notNull().default(true),
  order: integer("order").notNull().default(0),
  config: text("config").notNull().default("{}"),
});

export const insertHomepageSectionSchema = createInsertSchema(homepageSectionsTable).omit({ id: true });
export type InsertHomepageSection = z.infer<typeof insertHomepageSectionSchema>;
export type HomepageSection = typeof homepageSectionsTable.$inferSelect;
