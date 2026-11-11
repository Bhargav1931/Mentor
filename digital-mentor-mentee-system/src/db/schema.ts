import { pgTable, serial, text, integer, timestamp, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 200 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 20 }).notNull(), // mentor | mentee
  headline: varchar("headline", { length: 200 }).notNull().default(""),
  bio: text("bio").notNull().default(""),
  skills: text("skills").notNull().default(""), // comma separated
  yearsExperience: integer("years_experience").notNull().default(0),
  location: varchar("location", { length: 120 }).notNull().default(""),
  availability: varchar("availability", { length: 200 }).notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const authSessions = pgTable("auth_sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
});

export const mentorships = pgTable("mentorships", {
  id: serial("id").primaryKey(),
  mentorId: integer("mentor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  menteeId: integer("mentee_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | active | declined | completed
  message: text("message").notNull().default(""),
  goals: text("goals").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  respondedAt: timestamp("responded_at"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  mentorshipId: integer("mentorship_id").notNull().references(() => mentorships.id, { onDelete: "cascade" }),
  senderId: integer("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  mentorshipId: integer("mentorship_id").notNull().references(() => mentorships.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull().default(""),
  dueDate: varchar("due_date", { length: 20 }),
  status: varchar("status", { length: 20 }).notNull().default("todo"), // todo | in_progress | done
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const meetings = pgTable("meetings", {
  id: serial("id").primaryKey(),
  mentorshipId: integer("mentorship_id").notNull().references(() => mentorships.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  durationMin: integer("duration_min").notNull().default(30),
  meetingLink: text("meeting_link").notNull().default(""),
  notes: text("notes").notNull().default(""),
  status: varchar("status", { length: 20 }).notNull().default("scheduled"), // scheduled | completed | cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  mentorshipId: integer("mentorship_id").notNull().references(() => mentorships.id, { onDelete: "cascade" }),
  fromUserId: integer("from_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  toUserId: integer("to_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Mentorship = typeof mentorships.$inferSelect;
