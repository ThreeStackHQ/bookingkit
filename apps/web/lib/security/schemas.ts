/**
 * SEC-003: Email validation schema for invitee.
 * SEC-011: weekly_availability JSONB validation.
 */

import { z } from "zod";

// SEC-003: Email validation
export const inviteeSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(200),
  timezone: z.string().min(1).max(100),
});

export const bookingRequestSchema = z.object({
  calendarId: z.string().uuid(),
  inviteeEmail: z.string().email().max(255),
  inviteeName: z.string().min(1).max(200),
  inviteeTimezone: z.string().min(1).max(100),
  startsAt: z.string().datetime(),
  notes: z.string().max(2000).optional(),
});

export type BookingRequest = z.infer<typeof bookingRequestSchema>;

// SEC-011: weekly_availability JSONB structure validation
const timeString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
  message: "Time must be in HH:MM format (00:00-23:59)",
});

const daySlotSchema = z
  .object({
    start: timeString,
    end: timeString,
  })
  .refine(
    (data) => data.start < data.end,
    { message: "start must be before end" },
  );

// Days 0 (Sunday) through 6 (Saturday) — optional per day
const dayKeys = ["0", "1", "2", "3", "4", "5", "6"] as const;

export const weeklyAvailabilitySchema = z
  .record(
    z.enum(dayKeys),
    daySlotSchema,
  )
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one day must have availability" },
  );

// Also accept named days for backwards compatibility with existing default
const namedDayKeys = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

export const weeklyAvailabilityNamedSchema = z
  .record(
    z.enum(namedDayKeys),
    daySlotSchema,
  )
  .refine(
    (data) => Object.keys(data).length > 0,
    { message: "At least one day must have availability" },
  );

/** Accepts either numeric (0-6) or named day keys */
export const weeklyAvailabilityFlexSchema = z.union([
  weeklyAvailabilitySchema,
  weeklyAvailabilityNamedSchema,
]);

export type WeeklyAvailability = z.infer<typeof weeklyAvailabilityFlexSchema>;

// SEC-013: Cancellation request
export const cancelBookingSchema = z.object({
  token: z.string().uuid(),
});
