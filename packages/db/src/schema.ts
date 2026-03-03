import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  jsonb,
  pgEnum,
  date,
  time,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
  "rescheduled",
  "no_show",
]);

export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "indie",
  "pro",
]);

// ─── Users ───────────────────────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Workspaces ──────────────────────────────────────────

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  timezone: text("timezone").notNull().default("UTC"),
  description: text("description"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Calendars ───────────────────────────────────────────

export const calendars = pgTable("calendars", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(30),
  bufferMinutes: integer("buffer_minutes").notNull().default(0),
  color: text("color").notNull().default("#6366f1"),
  weeklyAvailability: jsonb("weekly_availability")
    .notNull()
    .default({
      monday: { start: "09:00", end: "17:00" },
      tuesday: { start: "09:00", end: "17:00" },
      wednesday: { start: "09:00", end: "17:00" },
      thursday: { start: "09:00", end: "17:00" },
      friday: { start: "09:00", end: "17:00" },
    }),
  maxAdvanceDays: integer("max_advance_days").notNull().default(60),
  minNoticeHours: integer("min_notice_hours").notNull().default(1),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Bookings ────────────────────────────────────────────

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  calendarId: uuid("calendar_id")
    .notNull()
    .references(() => calendars.id, { onDelete: "cascade" }),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  inviteeEmail: text("invitee_email").notNull(),
  inviteeName: text("invitee_name").notNull(),
  inviteeTimezone: text("invitee_timezone").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  status: bookingStatusEnum("status").notNull().default("confirmed"),
  cancelToken: uuid("cancel_token").defaultRandom().notNull(),
  rescheduleToken: uuid("reschedule_token").defaultRandom().notNull(),
  stripePaymentIntent: text("stripe_payment_intent"),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Availability Overrides ──────────────────────────────

export const availabilityOverrides = pgTable("availability_overrides", {
  id: uuid("id").primaryKey().defaultRandom(),
  calendarId: uuid("calendar_id")
    .notNull()
    .references(() => calendars.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  isBlocked: boolean("is_blocked").notNull().default(false),
  customStart: time("custom_start"),
  customEnd: time("custom_end"),
});

// ─── Webhook Endpoints ───────────────────────────────────

export const webhookEndpoints = pgTable("webhook_endpoints", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id")
    .notNull()
    .references(() => workspaces.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  events: text("events").array().notNull(),
  secret: text("secret").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// ─── Subscriptions ───────────────────────────────────────

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tier: subscriptionTierEnum("tier").notNull().default("free"),
  status: text("status").notNull().default("active"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
