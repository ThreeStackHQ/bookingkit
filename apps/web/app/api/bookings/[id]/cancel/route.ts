import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@bookingkit/db';
import { eq } from 'drizzle-orm';
import { getResend } from '@/lib/resend';

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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sp = req.nextUrl.searchParams;
  const cancelToken = sp.get('cancelToken');
  if (!cancelToken) return NextResponse.json({ error: 'cancelToken required' }, { status: 400, headers: corsHeaders() });

  const [booking] = await db.select().from(bookings)
    .where(eq(bookings.id, id)).limit(1);

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });
  if (booking.cancelToken !== cancelToken) return NextResponse.json({ error: 'Invalid token' }, { status: 403, headers: corsHeaders() });
  if (booking.status === 'cancelled') return NextResponse.json({ error: 'Already cancelled' }, { status: 409, headers: corsHeaders() });

  await db.update(bookings).set({ status: 'cancelled' }).where(eq(bookings.id, id));

  const resend = getResend();
  resend.emails.send({
    from: 'bookings@bookingkit.app',
    to: booking.inviteeEmail,
    subject: 'Booking cancelled',
    html: `<p>Your booking with ${booking.inviteeName} has been cancelled.</p>`,
  }).catch(console.error);

  return NextResponse.json({ success: true }, { headers: corsHeaders() });
}
