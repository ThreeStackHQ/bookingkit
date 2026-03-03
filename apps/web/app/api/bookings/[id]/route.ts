import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { bookings } from '@bookingkit/db';
import { eq } from 'drizzle-orm';

function corsHeaders() {
  return { 'Access-Control-Allow-Origin': '*' };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sp = req.nextUrl.searchParams;
  const cancelToken = sp.get('cancelToken');
  const rescheduleToken = sp.get('rescheduleToken');

  if (!cancelToken && !rescheduleToken) {
    return NextResponse.json({ error: 'Token required' }, { status: 400, headers: corsHeaders() });
  }

  const [booking] = await db.select().from(bookings)
    .where(eq(bookings.id, id)).limit(1);

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: corsHeaders() });

  if (cancelToken && booking.cancelToken !== cancelToken) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403, headers: corsHeaders() });
  }
  if (rescheduleToken && booking.rescheduleToken !== rescheduleToken) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 403, headers: corsHeaders() });
  }

  return NextResponse.json({ booking }, { headers: corsHeaders() });
}
