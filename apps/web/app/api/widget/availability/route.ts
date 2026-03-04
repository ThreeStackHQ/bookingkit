/**
 * GET /api/widget/availability
 *
 * SEC-004: CORS is configured to allow wildcard origin (*) for widget embeds.
 * This is intentional — the widget is a public embed and must be accessible
 * from any domain. Only read-only availability data is exposed.
 *
 * SEC-011: weekly_availability JSONB is validated when calendars are created/updated,
 * not on read. See the calendars route for the validation schema.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** SEC-004: CORS headers for widget endpoints — wildcard is intentional for public embeds */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const calendarId = searchParams.get("calendarId");

  if (!calendarId) {
    return NextResponse.json(
      { status: "fail", message: "calendarId is required" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  // TODO: Fetch calendar availability slots (milestone 1.3)
  // This stub returns the CORS-enabled response shape

  return NextResponse.json(
    {
      status: "success",
      data: { calendarId, slots: [] },
    },
    { headers: CORS_HEADERS },
  );
}
