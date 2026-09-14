import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { operatorsTable } from "./operators";
import { tripsTable } from "./trips";

export const enquiriesTable = pgTable("enquiries", {
  id: serial("id").primaryKey(),
  operatorId: integer("operator_id").notNull().references(() => operatorsTable.id),
  tripId: integer("trip_id").notNull().references(() => tripsTable.id),
  message: text("message").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Enquiry = typeof enquiriesTable.$inferSelect;