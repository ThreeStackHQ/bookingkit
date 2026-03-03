import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calendars, bookings, availabilityOverrides } from '@bookingkit/db';
import { eq, and, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

const querySchema = z.object({
  calendarId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().min(1).default('UTC'),
});

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!rateLimit(`slots:${ip}`, 60, 60000)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: corsHeaders() });
  }

  const sp = req.nextUrl.searchParams;
  const parsed = querySchema.safeParse({
    calendarId: sp.get('calendarId'),
    date: sp.get('date'),
    timezone: sp.get('timezone') ?? 'UTC',
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400, headers: corsHeaders() });
  }

  const { calendarId, date } = parsed.data;

  const [calendar] = await db.select().from(calendars)
    .where(and(eq(calendars.id, calendarId), eq(calendars.active, true))).limit(1);

  if (!calendar) {
    return NextResponse.json({ error: 'Calendar not found' }, { status: 404, headers: corsHeaders() });
  }

  // Check maxAdvanceDays
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const targetDate = new Date(date + 'T00:00:00Z');
  const daysDiff = (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);

  if (daysDiff < 0 || daysDiff > calendar.maxAdvanceDays) {
    return NextResponse.json({ slots: [] }, { headers: corsHeaders() });
  }

  // Get day of week (0=Sunday)
  const dayOfWeek = targetDate.getUTCDay().toString();
  const avail = (calendar.weeklyAvailability as Record<string, { start: string; end: string; enabled: boolean }>)[dayOfWeek];

  if (!avail?.enabled) {
    return NextResponse.json({ slots: [] }, { headers: corsHeaders() });
  }

  let startTime = avail.start;
  let endTime = avail.end;

  // Check overrides
  const [override] = await db.select().from(availabilityOverrides)
    .where(and(
      eq(availabilityOverrides.calendarId, calendarId),
      eq(availabilityOverrides.date, date)
    )).limit(1);

  if (override) {
    if (override.isBlocked) return NextResponse.json({ slots: [] }, { headers: corsHeaders() });
    if (override.customStart) startTime = override.customStart;
    if (override.customEnd) endTime = override.customEnd;
  }

  // Load existing confirmed/pending bookings for this day
  const dayStart = new Date(date + 'T00:00:00Z');
  const dayEnd = new Date(date + 'T23:59:59Z');

  const existingBookings = await db.select().from(bookings)
    .where(and(
      eq(bookings.calendarId, calendarId),
      gte(bookings.startsAt, dayStart),
      lte(bookings.endsAt, dayEnd),
    ));

  const activeBookings = existingBookings.filter(b => b.status !== 'cancelled');

  // Generate slots
  const slots: Array<{ start: string; end: string; available: boolean }> = [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);

  const dayStartMs = dayStart.getTime() + (startH * 60 + startM) * 60 * 1000;
  const dayEndMs = dayStart.getTime() + (endH * 60 + endM) * 60 * 1000;
  const slotMs = calendar.durationMinutes * 60 * 1000;
  const bufferMs = calendar.bufferMinutes * 60 * 1000;
  const nowPlusNotice = new Date(Date.now() + calendar.minNoticeHours * 60 * 60 * 1000);

  for (let ms = dayStartMs; ms + slotMs <= dayEndMs; ms += slotMs) {
    const slotStart = new Date(ms);
    const slotEnd = new Date(ms + slotMs);

    if (slotStart < nowPlusNotice) continue;

    const hasConflict = activeBookings.some(b => {
      const bStart = new Date(b.startsAt).getTime() - bufferMs;
      const bEnd = new Date(b.endsAt).getTime() + bufferMs;
      return slotStart.getTime() < bEnd && slotEnd.getTime() > bStart;
    });

    slots.push({
      start: slotStart.toISOString(),
      end: slotEnd.toISOString(),
      available: !hasConflict,
    });
  }

  return NextResponse.json({ slots }, { headers: corsHeaders() });
}
