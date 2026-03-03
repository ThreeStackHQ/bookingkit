import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { getStripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { workspaces } from '@bookingkit/db';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { env } from '@/lib/env';

const schema = z.object({ plan: z.enum(['indie', 'pro']) });

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [ws] = await db.select().from(workspaces).where(eq(workspaces.ownerId, session.user.id)).limit(1);
  if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

  const priceId = parsed.data.plan === 'indie' ? env.STRIPE_PRICE_INDIE : env.STRIPE_PRICE_PRO;
  const stripe = getStripe();

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=1`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/billing`,
    metadata: { workspaceId: ws.id, plan: parsed.data.plan },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
