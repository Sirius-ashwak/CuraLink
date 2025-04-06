import { pgTable, text, serial, integer, boolean, timestamp, json, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role", { enum: ["doctor", "patient"] }).notNull(),
  specialty: text("specialty"),
  profile: json("profile").$type<{
    age?: number;
    gender?: string;
    bio?: string;
    avatar?: string;
    phone?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const doctors = pgTable("doctors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  specialty: text("specialty").notNull(),
  averageRating: integer("average_rating"),
  reviewCount: integer("review_count").default(0),
  isAvailable: boolean("is_available").default(true),
});

export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 for Sunday-Saturday
  startTime: text("start_time").notNull(), // Format: "HH:MM", 24h format
  endTime: text("end_time").notNull(), // Format: "HH:MM", 24h format
  isAvailable: boolean("is_available").default(true),
});

export const timeOff = pgTable("time_off", {
  id: serial("id").primaryKey(),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  title: text("title").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => users.id),
  doctorId: integer("doctor_id").notNull().references(() => doctors.id),
  date: timestamp("date").notNull(),
  startTime: text("start_time").notNull(), // Format: "HH:MM", 24h format
  endTime: text("end_time").notNull(), // Format: "HH:MM", 24h format
  status: text("status", { enum: ["scheduled", "confirmed", "canceled", "completed"] }).notNull().default("scheduled"),
  type: text("type", { enum: ["video", "audio"] }).notNull().default("video"),
  reason: text("reason"),
  notes: text("notes"),
  callUrl: text("call_url"),
});

export const emergencyTransport = pgTable("emergency_transport", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull().references(() => users.id),
  requestDate: timestamp("request_date").notNull().defaultNow(),
  pickupLocation: text("pickup_location").notNull(),
  pickupCoordinates: text("pickup_coordinates"),
  destination: text("destination").notNull(),
  reason: text("reason").notNull(),
  urgency: text("urgency", { enum: ["low", "medium", "high", "critical"] }).notNull(),
  status: text("status", { enum: ["requested", "assigned", "in_progress", "completed", "canceled"] }).notNull().default("requested"),
  estimatedArrival: timestamp("estimated_arrival"),
  vehicleType: text("vehicle_type", { enum: ["ambulance", "wheelchair_van", "medical_car", "helicopter"] }).notNull(),
  driverName: text("driver_name"),
  driverPhone: varchar("driver_phone", { length: 20 }),
  notes: text("notes"),
  assignedHospital: text("assigned_hospital"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  role: true,
  specialty: true,
  profile: true,
});

export const insertDoctorSchema = createInsertSchema(doctors).omit({
  id: true,
});

export const insertAvailabilitySchema = createInsertSchema(availability).omit({
  id: true,
});

export const insertTimeOffSchema = createInsertSchema(timeOff).omit({
  id: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
});

export const insertEmergencyTransportSchema = createInsertSchema(emergencyTransport).omit({
  id: true,
  requestDate: true,
  driverName: true,
  driverPhone: true,
  estimatedArrival: true,
  status: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type Doctor = typeof doctors.$inferSelect;

export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type Availability = typeof availability.$inferSelect;

export type InsertTimeOff = z.infer<typeof insertTimeOffSchema>;
export type TimeOff = typeof timeOff.$inferSelect;

export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type Appointment = typeof appointments.$inferSelect;

export type InsertEmergencyTransport = z.infer<typeof insertEmergencyTransportSchema>;
export type EmergencyTransport = typeof emergencyTransport.$inferSelect;

// User with doctor information for convenience
export type DoctorWithUserInfo = Doctor & {
  user: User;
};

// Appointment with additional user information
export type AppointmentWithUsers = Appointment & {
  patient: User;
  doctor: DoctorWithUserInfo;
};

// Emergency transport with patient information
export type EmergencyTransportWithPatient = EmergencyTransport & {
  patient: User;
};
