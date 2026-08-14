import { pgTable, text, serial, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const cctvTable = pgTable("cctv_cameras", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  streamUrl: text("stream_url").notNull(),
  embedUrl: text("embed_url"),
  isActive: boolean("is_active").notNull().default(true),
  order: integer("order").notNull().default(0),
  description: text("description"),
});

export const insertCctvSchema = createInsertSchema(cctvTable).omit({ id: true });
export type InsertCctv = z.infer<typeof insertCctvSchema>;
export type CctvCamera = typeof cctvTable.$inferSelect;
