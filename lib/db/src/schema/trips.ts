import { relations } from "drizzle-orm";
import { date, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tripsTable = pgTable("trips", {
  id: serial("id").primaryKey(),
  startLocation: text("start_location").notNull(),
  startDate: date("start_date", { mode: "string" }).notNull(),
  endDate: date("end_date", { mode: "string" }).notNull(),
  passengerCount: integer("passenger_count").notNull(),
  vehicleType: text("vehicle_type").notNull(),
  tripType: text("trip_type").notNull(),
  specialRequirements: text("special_requirements").notNull().default(""),
  status: text("status").notNull().default("planning"),
  totalRouteDistanceKm: integer("total_route_distance_km"),
  estimatedDriveTime: text("estimated_drive_time"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tripDestinationsTable = pgTable("trip_destinations", {
  id: serial("id").primaryKey(),
  tripId: integer("trip_id").notNull().references(() => tripsTable.id, { onDelete: "cascade" }),
  sequenceOrder: integer("sequence_order").notNull(),
  destinationName: text("destination_name").notNull(),
  stayDays: integer("stay_days").notNull(),
  roamingRadiusKm: integer("roaming_radius_km").notNull(),
  notes: text("notes").notNull().default(""),
});

export const tripsRelations = relations(tripsTable, ({ many }) => ({
  destinations: many(tripDestinationsTable),
}));

export const tripDestinationsRelations = relations(tripDestinationsTable, ({ one }) => ({
  trip: one(tripsTable, {
    fields: [tripDestinationsTable.tripId],
    references: [tripsTable.id],
  }),
}));

export const insertTripSchema = createInsertSchema(tripsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof tripsTable.$inferSelect;
export type TripDestination = typeof tripDestinationsTable.$inferSelect;