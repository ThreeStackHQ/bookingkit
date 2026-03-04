/**
 * POST /api/bookings/cancel
 *
 * SEC-013: Cancellation via unique UUID token. Token is single-use —
 * the cancel_token is nullified after successful cancellation to prevent replay.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings } from "@bookingkit/db/schema";
import { cancelBookingSchema } from "@/lib/security/schemas";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body: unknown = await request.json();
  const parsed = cancelBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "fail",
        message: "Invalid cancellation request",
        code: "VALIDATION_ERROR",
      },
      { status: 422 },
    );
  }

  const { token } = parsed.data;

  // Atomically find-and-cancel: only if token matches AND is not already used
  const result = await db
    .update(bookings)
    .set({
      status: "cancelled",
      cancelToken: sql`NULL`, // SEC-013: single-use — nullify token
    })
    .where(
      and(
        eq(bookings.cancelToken, token),
        sql`${bookings.status} NOT IN ('cancelled')`,
      ),
    )
    .returning({ id: bookings.id });

  if (result.length === 0) {
    return NextResponse.json(
      {
        status: "fail",
        message: "Invalid or already used cancellation token",
        code: "INVALID_TOKEN",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    status: "success",
    data: { bookingId: result[0]!.id, cancelled: true },
  });
}
