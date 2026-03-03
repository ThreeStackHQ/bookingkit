import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings, calendars } from '@bookingkit/db';
import { eq, and, gte, lte } from 'drizzle-orm';
import { z } from 'zod';
import { getResend } from '@/lib/resend';
import { generateIcs } from '@/lib/ics';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

const schema = z.object({ newStartsAt: z.string().datetime() });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sp = req.nextUrl.searchParams;
  const rescheduleToken = sp.get('rescheduleToken');
  if (!rescheduleToken) return NextResponse.json({ error: 'rescheduleToken required' }, { status: 400, headers: corsHeaders() });

  const [booking] = await db.select().from(bookings)
    .where(eq(bookings.id, id)).limit(1);

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
  if (booking.rescheduleToken !== rescheduleToken) return NextResponse.json({ error: 'Invalid token' }, { status: 403, headers: corsHeaders() });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400, headers: corsHeaders() });

  const [cal] = await db.select().from(calendars).where(eq(calendars.id, booking.calendarId)).limit(1);
  if (!cal) return NextResponse.json({ error: 'Calendar not found' }, { status: 404, headers: corsHeaders() });

  const newStartsAt = new Date(parsed.data.newStartsAt);
  const newEndsAt = new Date(newStartsAt.getTime() + cal.durationMinutes * 60 * 1000);

  const dayStart = new Date(newStartsAt);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(newStartsAt);
  dayEnd.setUTCHours(23, 59, 59, 999);

  const conflicting = await db.select().from(bookings)
    .where(and(
      eq(bookings.calendarId, booking.calendarId),
      gte(bookings.startsAt, dayStart),
      lte(bookings.endsAt, dayEnd),
    ));

  const hasConflict = conflicting
    .filter(b => b.id !== booking.id && b.status !== 'cancelled')
    .some(b => newStartsAt < b.endsAt && newEndsAt > b.startsAt);

  if (hasConflict) return NextResponse.json({ error: 'Slot not available' }, { status: 409, headers: corsHeaders() });

  const [updated] = await db.update(bookings).set({
    startsAt: newStartsAt,
    endsAt: newEndsAt,
    status: 'rescheduled',
  }).where(eq(bookings.id, id)).returning();

  const ics = generateIcs({
    summary: `Meeting with ${booking.inviteeName}`,
    description: 'BookingKit appointment (rescheduled)',
    startsAt: newStartsAt,
    endsAt: newEndsAt,
    organizerEmail: booking.inviteeEmail,
    attendeeEmail: booking.inviteeEmail,
  });

  const resend = getResend();
  resend.emails.send({
    from: 'bookings@bookingkit.app',
    to: booking.inviteeEmail,
    subject: 'Booking rescheduled',
    html: `<p>Your booking has been rescheduled to ${newStartsAt.toUTCString()}.</p>`,
    attachments: [{ filename: 'booking.ics', content: Buffer.from(ics).toString('base64') }],
  }).catch(console.error);

  return NextResponse.json({ booking: updated }, { headers: corsHeaders() });
}
