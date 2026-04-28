import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  doublePrecision,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const propertiesTable = pgTable("properties", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  titleFr: text("title_fr"),
  titleAr: text("title_ar"),
  description: text("description").notNull(),
  descriptionFr: text("description_fr"),
  descriptionAr: text("description_ar"),
  city: text("city").notNull(),
  neighborhood: text("neighborhood"),
  propertyType: text("property_type").notNull(),
  status: text("status").notNull().default("ready"),
  price: integer("price").notNull(),
  bedrooms: integer("bedrooms").notNull().default(0),
  bathrooms: integer("bathrooms").notNull().default(0),
  areaSqm: integer("area_sqm").notNull().default(0),
  yearBuilt: integer("year_built"),
  images: text("images").array().notNull().default([]),
  features: text("features").array().notNull().default([]),
  locationLat: doublePrecision("location_lat"),
  locationLng: doublePrecision("location_lng"),
  featured: boolean("featured").notNull().default(false),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertPropertySchema = createInsertSchema(propertiesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof propertiesTable.$inferSelect;
