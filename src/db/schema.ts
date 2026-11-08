import {
  pgTable,
  pgEnum,
  integer,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";

export const appointmentStatus = pgEnum("appointment_status", [
  "pending",
  "confirmed",
  "cancelled",
]);

export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
});

export const appointments = pgTable("appointments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  patientName: varchar("patient_name", { length: 120 }).notNull(),
  specialty: varchar("specialty", { length: 120 }).notNull(),
  scheduledAt: timestamp("scheduled_at", {
    withTimezone: true,
  }).notNull(),
  status: appointmentStatus("status").notNull().default("pending"),
});