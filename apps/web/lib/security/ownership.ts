/**
 * SEC-009: IDOR prevention — workspace ownership guards.
 * All queries for bookings, calendars, and slots must be scoped to the
 * authenticated user's workspace.
 */

import { eq, and } from "drizzle-orm";
import type { Database } from "@bookingkit/db";
import { workspaces, calendars, bookings } from "@bookingkit/db/schema";

export async function assertWorkspaceOwner(
  db: Database,
  workspaceId: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.userId, userId)))
    .limit(1);

  return result.length > 0;
}

export async function assertCalendarOwner(
  db: Database,
  calendarId: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .select({ id: calendars.id })
    .from(calendars)
    .innerJoin(workspaces, eq(calendars.workspaceId, workspaces.id))
    .where(and(eq(calendars.id, calendarId), eq(workspaces.userId, userId)))
    .limit(1);

  return result.length > 0;
}

export async function assertBookingOwner(
  db: Database,
  bookingId: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .select({ id: bookings.id })
    .from(bookings)
    .innerJoin(workspaces, eq(bookings.workspaceId, workspaces.id))
    .where(and(eq(bookings.id, bookingId), eq(workspaces.userId, userId)))
    .limit(1);

  return result.length > 0;
}
