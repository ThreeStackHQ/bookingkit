import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { workspaces, subscriptions, bookings } from '@bookingkit/db';
import { eq } from 'drizzle-orm';
import { env } from '@/lib/env';
import type Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET ?? 'whsec_placeholder');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const sub = event.data.object as Stripe.Subscription;
    const workspaceId = sub.metadata?.workspaceId;
    if (!workspaceId) return NextResponse.json({ ok: true });

    const priceId = sub.items.data[0]?.price.id ?? '';
    const plan = priceId === env.STRIPE_PRICE_PRO ? 'pro' : priceId === env.STRIPE_PRICE_INDIE ? 'indie' : 'free';

    await db.update(workspaces).set({ plan: plan as 'free' | 'indie' | 'pro' }).where(eq(workspaces.id, workspaceId));

    await db.insert(subscriptions).values({
      workspaceId,
      stripeCustomerId: sub.customer as string,
      stripeSubscriptionId: sub.id,
      stripePriceId: priceId,
      status: sub.status,
      currentPeriodEnd: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
    }).onConflictDoUpdate({
      target: [subscriptions.workspaceId],
      set: {
        stripeCustomerId: sub.customer as string,
        stripeSubscriptionId: sub.id,
        stripePriceId: priceId,
        status: sub.status,
        currentPeriodEnd: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
        updatedAt: new Date(),
      },
    });
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription;
    const workspaceId = sub.metadata?.workspaceId;
    if (workspaceId) {
      await db.update(workspaces).set({ plan: 'free' }).where(eq(workspaces.id, workspaceId));
    }
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    if (pi.metadata?.bookingId) {
      await db.update(bookings).set({ stripePaymentIntentId: pi.id })
        .where(eq(bookings.id, pi.metadata.bookingId));
    }
  }

  return NextResponse.json({ ok: true });
}
