/**
 * POST /api/bookings
 *
 * SEC-001: Rate limited to 10 requests/min per IP.
 * SEC-002: Uses database transaction with row locking to prevent double-booking.
 * SEC-003: Validates invitee email via Zod before processing.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { eq, and, gte, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, calendars } from "@bookingkit/db/schema";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";
import { bookingRequestSchema } from "@/lib/security/schemas";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // SEC-001: Rate limiting — 10 per minute per IP
  const ip = getClientIp(request);
  const limit = checkRateLimit(`booking:${ip}`, 10, 60_000);

  if (!limit.allowed) {
    return NextResponse.json(
      {
        status: "fail",
        message: "Too many booking requests. Please try again later.",
        code: "RATE_LIMIT_EXCEEDED",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(limit.retryAfterMs / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  // SEC-003: Validate input with Zod email schema
  const body: unknown = await request.json();
  const parsed = bookingRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "fail",
        message: "Invalid booking data",
        code: "VALIDATION_ERROR",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const data = parsed.data;

  // SEC-002: Transaction with row locking to prevent double-booking
  try {
    const result = await db.transaction(async (tx) => {
      // Lock the calendar row to serialize concurrent booking attempts
      const [calendar] = await tx
        .select()
        .from(calendars)
        .where(eq(calendars.id, data.calendarId))
        .for("update");

      if (!calendar || !calendar.active) {
        return { error: "Calendar not found or inactive", status: 404 };
      }

      const startsAt = new Date(data.startsAt);
      const endsAt = new Date(
        startsAt.getTime() + calendar.durationMinutes * 60_000,
      );

      // Check for overlapping confirmed bookings (with row lock)
      const conflicts = await tx
        .select({ id: bookings.id })
        .from(bookings)
        .where(
          and(
            eq(bookings.calendarId, data.calendarId),
            sql`${bookings.status} NOT IN ('cancelled')`,
            lt(bookings.startsAt, endsAt),
            gte(bookings.endsAt, startsAt),
          ),
        )
        .for("update");

      if (conflicts.length > 0) {
        return { error: "Time slot is no longer available", status: 409 };
      }

      // Create the booking
      const [booking] = await tx
        .insert(bookings)
        .values({
          calendarId: data.calendarId,
          workspaceId: calendar.workspaceId,
          inviteeEmail: data.inviteeEmail,
          inviteeName: data.inviteeName,
          inviteeTimezone: data.inviteeTimezone,
          startsAt,
          endsAt,
          notes: data.notes ?? null,
        })
        .returning();

      return { booking, status: 201 };
    });

    if ("error" in result) {
      return NextResponse.json(
        { status: "fail", message: result.error, code: "BOOKING_ERROR" },
        { status: result.status },
      );
    }

    return NextResponse.json(
      { status: "success", data: result.booking },
      {
        status: 201,
        headers: {
          "X-RateLimit-Remaining": String(limit.remaining),
        },
      },
    );
  } catch (error) {
    console.error("Booking creation failed:", error);
    return NextResponse.json(
      {
        status: "fail",
        message: "An error occurred while creating the booking",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}
