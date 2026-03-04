/**
 * GET /api/cron/reminders
 *
 * SEC-012: Protected by CRON_SECRET with timing-safe comparison.
 * Prevents timing attacks that could leak the secret value.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { timingSafeCompare } from "@/lib/security/timing-safe";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET not configured");
    return NextResponse.json(
      { status: "fail", message: "Cron not configured" },
      { status: 500 },
    );
  }

  // SEC-012: Extract secret from Authorization header
  const authHeader = request.headers.get("authorization");
  const providedSecret = authHeader?.replace("Bearer ", "") ?? "";

  if (!timingSafeCompare(providedSecret, cronSecret)) {
    return NextResponse.json(
      { status: "fail", message: "Unauthorized" },
      { status: 401 },
    );
  }

  // TODO: Send booking reminders (24h and 1h before)
  // This is the cron handler stub — business logic will be added in a future milestone

  return NextResponse.json({
    status: "success",
    data: { message: "Reminders processed" },
  });
}
