import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../auth';
import { db } from '@/lib/db';
import { bookings, calendars, workspaces } from '@bookingkit/db';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { getResend } from '@/lib/resend';
import { generateIcs } from '@/lib/ics';
import { getTierLimits } from '@/lib/tier';
import type { Plan } from '@/lib/tier';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

const createSchema = z.object({
  calendarId: z.string().uuid(),
  inviteeName: z.string().min(1).max(200),
  inviteeEmail: z.string().email(),
  inviteeTz: z.string().min(1).default('UTC'),
  startsAt: z.string().datetime(),
  notes: z.string().max(2000).optional(),
  depositCents: z.number().int().positive().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  if (!rateLimit(`bookings:${ip}`, 10, 60000)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: corsHeaders() });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders() });

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400, headers: corsHeaders() });

  const { calendarId, inviteeName, inviteeEmail, inviteeTz, startsAt: startsAtStr, notes, depositCents, metadata } = parsed.data;

  const [calendar] = await db.select().from(calendars)
    .where(and(eq(calendars.id, calendarId), eq(calendars.active, true))).limit(1);

  if (!calendar) return NextResponse.json({ error: 'Calendar not found' }, { status: 404, headers: corsHeaders() });

  const [ws] = await db.select().from(workspaces).where(eq(workspaces.id, calendar.workspaceId)).limit(1);
  if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404, headers: corsHeaders() });

  const limits = getTierLimits(ws.plan as Plan);

  if (limits.bookingsPerMonth !== Infinity) {
    const now = new Date();
    const resetAt = ws.bookingsResetAt ? new Date(ws.bookingsResetAt) : new Date();
    if (resetAt.getMonth() !== now.getMonth() || resetAt.getFullYear() !== now.getFullYear()) {
      await db.update(workspaces).set({ bookingsThisMonth: 0, bookingsResetAt: now }).where(eq(workspaces.id, ws.id));
      ws.bookingsThisMonth = 0;
    }
    if ((ws.bookingsThisMonth ?? 0) >= limits.bookingsPerMonth) {
      return NextResponse.json({ error: 'Monthly booking limit reached', upgradeUrl: '/billing' }, { status: 403, headers: corsHeaders() });
    }
  }

  const startsAt = new Date(startsAtStr);
  const endsAt = new Date(startsAt.getTime() + calendar.durationMinutes * 60 * 1000);

  if (depositCents) {
    const { getStripe } = await import('@/lib/stripe');
    const stripeClient = getStripe();
    const pi = await stripeClient.paymentIntents.create({
      amount: depositCents,
      currency: 'usd',
      metadata: { calendarId, inviteeEmail },
    });
    return NextResponse.json({ requiresPayment: true, clientSecret: pi.client_secret }, { headers: corsHeaders() });
  }

  try {
    const [booking] = await db.insert(bookings).values({
      calendarId,
      workspaceId: ws.id,
      inviteeName,
      inviteeEmail,
      inviteeTz,
      startsAt,
      endsAt,
      status: 'confirmed',
      notes,
      metadata: metadata ?? null,
    }).returning();

    await db.update(workspaces).set({
      bookingsThisMonth: (ws.bookingsThisMonth ?? 0) + 1,
    }).where(eq(workspaces.id, ws.id));
    await db.update(calendars).set({
      bookingCount: (calendar.bookingCount ?? 0) + 1,
    }).where(eq(calendars.id, calendarId));

    const ics = generateIcs({
      summary: `Meeting with ${inviteeName}`,
      description: 'BookingKit appointment',
      startsAt,
      endsAt,
      organizerEmail: inviteeEmail,
      attendeeEmail: inviteeEmail,
    });

    const resend = getResend();
    const dateStr = startsAt.toUTCString();

    resend.emails.send({
      from: 'bookings@bookingkit.app',
      to: inviteeEmail,
      subject: `Booking confirmed: ${calendar.name}`,
      html: `<h2>Your booking is confirmed!</h2><p>You have a booking for <strong>${calendar.name}</strong> on ${dateStr}.</p>${notes ? `<p>Notes: ${notes}</p>` : ''}`,
      attachments: [{ filename: 'booking.ics', content: Buffer.from(ics).toString('base64') }],
    }).catch(console.error);

    return NextResponse.json({ booking }, { status: 201, headers: corsHeaders() });
  } catch (err: unknown) {
    const pgErr = err as { code?: string };
    if (pgErr.code === '23505') {
      return NextResponse.json({ error: 'Time slot no longer available' }, { status: 409, headers: corsHeaders() });
    }
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders() });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [ws] = await db.select().from(workspaces).where(eq(workspaces.ownerId, session.user.id)).limit(1);
  if (!ws) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const rows = await db.select().from(bookings)
    .where(eq(bookings.workspaceId, ws.id))
    .orderBy(desc(bookings.startsAt))
    .limit(50);

  return NextResponse.json({ bookings: rows, nextCursor: rows.length === 50 ? rows[49]?.id : null });
}
