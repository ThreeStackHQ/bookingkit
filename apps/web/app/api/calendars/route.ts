/**
 * POST /api/calendars — Create calendar
 *
 * SEC-009: Workspace ownership verified before creation.
 * SEC-011: weekly_availability JSONB validated with strict schema.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { weeklyAvailabilityFlexSchema } from "@/lib/security/schemas";

const createCalendarSchema = z.object({
  workspaceId: z.string().uuid(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, {
    message: "Slug must be lowercase alphanumeric with hyphens",
  }),
  durationMinutes: z.number().int().min(5).max(480).default(30),
  bufferMinutes: z.number().int().min(0).max(120).default(0),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1"),
  // SEC-011: Strict JSONB validation — days 0-6 or named, HH:MM format
  weeklyAvailability: weeklyAvailabilityFlexSchema,
  maxAdvanceDays: z.number().int().min(1).max(365).default(60),
  minNoticeHours: z.number().int().min(0).max(168).default(1),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  // TODO: Extract userId from session (SEC-009: ownership check)
  // const userId = await getSessionUserId(request);
  // if (!userId) return NextResponse.json({ ... }, { status: 401 });

  const body: unknown = await request.json();
  const parsed = createCalendarSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        status: "fail",
        message: "Invalid calendar data",
        code: "VALIDATION_ERROR",
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  // TODO: SEC-009 — verify assertWorkspaceOwner(db, parsed.data.workspaceId, userId)
  // TODO: Insert calendar into database

  return NextResponse.json(
    {
      status: "success",
      data: { message: "Calendar creation stub — pending auth integration" },
    },
    { status: 201 },
  );
}
