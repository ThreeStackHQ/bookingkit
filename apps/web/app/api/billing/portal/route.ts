import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { getStripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { workspaces, subscriptions } from '@bookingkit/db';
import { eq } from 'drizzle-orm';
import { env } from '@/lib/env';

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [ws] = await db.select().from(workspaces).where(eq(workspaces.ownerId, session.user.id)).limit(1);
  if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.workspaceId, ws.id)).limit(1);
  if (!sub?.stripeCustomerId) return NextResponse.json({ error: 'No subscription found' }, { status: 404 });

  const stripe = getStripe();
  const portal = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${env.NEXT_PUBLIC_APP_URL}/billing`,
  });

  return NextResponse.redirect(portal.url);
}
