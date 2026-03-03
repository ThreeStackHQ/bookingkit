import {
  pgTable, text, timestamp, uuid, integer, boolean, jsonb, pgEnum, date, time, index, unique
} from 'drizzle-orm/pg-core';

export const planEnum = pgEnum('plan', ['free', 'indie', 'pro']);
export const bookingStatusEnum = pgEnum('booking_status', ['pending', 'confirmed', 'cancelled', 'rescheduled', 'no_show']);
export const webhookDeliveryStatusEnum = pgEnum('webhook_delivery_status', ['pending', 'delivered', 'failed']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  ownerId: uuid('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  plan: planEnum('plan').notNull().default('free'),
  bookingsThisMonth: integer('bookings_this_month').notNull().default(0),
  bookingsResetAt: timestamp('bookings_reset_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }).unique(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripePriceId: text('stripe_price_id'),
  status: text('status').notNull().default('active'),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const calendars = pgTable('calendars', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  description: text('description'),
  color: text('color').notNull().default('#6366f1'),
  durationMinutes: integer('duration_minutes').notNull().default(30),
  bufferMinutes: integer('buffer_minutes').notNull().default(0),
  maxAdvanceDays: integer('max_advance_days').notNull().default(60),
  minNoticeHours: integer('min_notice_hours').notNull().default(1),
  weeklyAvailability: jsonb('weekly_availability').$type<Record<string, { start: string; end: string; enabled: boolean }>>().notNull().default({
    '0': { start: '09:00', end: '17:00', enabled: false },
    '1': { start: '09:00', end: '17:00', enabled: true },
    '2': { start: '09:00', end: '17:00', enabled: true },
    '3': { start: '09:00', end: '17:00', enabled: true },
    '4': { start: '09:00', end: '17:00', enabled: true },
    '5': { start: '09:00', end: '17:00', enabled: true },
    '6': { start: '09:00', end: '17:00', enabled: false },
  }),
  active: boolean('active').notNull().default(true),
  timezone: text('timezone').notNull().default('UTC'),
  bookingCount: integer('booking_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  workspaceSlugUnique: unique().on(t.workspaceId, t.slug),
}));

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  calendarId: uuid('calendar_id').notNull().references(() => calendars.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  inviteeName: text('invitee_name').notNull(),
  inviteeEmail: text('invitee_email').notNull(),
  inviteeTz: text('invitee_tz').notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
  status: bookingStatusEnum('status').notNull().default('confirmed'),
  cancelToken: uuid('cancel_token').defaultRandom().notNull().unique(),
  rescheduleToken: uuid('reschedule_token').defaultRandom().notNull().unique(),
  notes: text('notes'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  calendarStartIdx: index().on(t.calendarId, t.startsAt),
}));

export const availabilityOverrides = pgTable('availability_overrides', {
  id: uuid('id').primaryKey().defaultRandom(),
  calendarId: uuid('calendar_id').notNull().references(() => calendars.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  isBlocked: boolean('is_blocked').notNull().default(false),
  customStart: time('custom_start'),
  customEnd: time('custom_end'),
}, (t) => ({
  calendarDateUnique: unique().on(t.calendarId, t.date),
}));

export const webhookEndpoints = pgTable('webhook_endpoints', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  events: text('events').array().notNull().default([]),
  secret: text('secret').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  endpointId: uuid('endpoint_id').notNull().references(() => webhookEndpoints.id, { onDelete: 'cascade' }),
  event: text('event').notNull(),
  payload: jsonb('payload').notNull(),
  statusCode: integer('status_code'),
  status: webhookDeliveryStatusEnum('status').notNull().default('pending'),
  attempts: integer('attempts').notNull().default(0),
  nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
