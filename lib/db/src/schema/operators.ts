import { relations } from "drizzle-orm";
import { boolean, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const operatorsTable = pgTable("operators", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  operatorType: text("operator_type").notNull(),
  description: text("description").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  yearsExperience: integer("years_experience").notNull(),
  verificationStatus: text("verification_status").notNull(),
  rating: integer("rating").notNull(),
  totalReviews: integer("total_reviews").notNull(),
  maxTripDistanceKm: integer("max_trip_distance_km").notNull(),
  maxTripDurationDays: integer("max_trip_duration_days").notNull(),
  roamingCapabilityKm: integer("roaming_capability_km").notNull(),
  serviceAreas: text("service_areas").array().notNull(),
  preferredDestinations: text("preferred_destinations").array().notNull(),
  tripTypes: text("trip_types").array().notNull(),
  phone: text("phone").notNull(),
  whatsapp: text("whatsapp").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const operatorVehiclesTable = pgTable("operator_vehicles", {
  id: serial("id").primaryKey(),
  operatorId: integer("operator_id").notNull().references(() => operatorsTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  label: text("label").notNull(),
  seats: integer("seats").notNull(),
  ac: boolean("ac").notNull(),
});

export const operatorsRelations = relations(operatorsTable, ({ many }) => ({
  vehicles: many(operatorVehiclesTable),
}));

export const operatorVehiclesRelations = relations(operatorVehiclesTable, ({ one }) => ({
  operator: one(operatorsTable, {
    fields: [operatorVehiclesTable.operatorId],
    references: [operatorsTable.id],
  }),
}));

export type Operator = typeof operatorsTable.$inferSelect;
export type OperatorVehicle = typeof operatorVehiclesTable.$inferSelect;