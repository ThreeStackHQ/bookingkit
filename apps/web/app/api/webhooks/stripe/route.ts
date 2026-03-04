/**
 * POST /api/webhooks/stripe
 *
 * SEC-007: Stripe webhook validation.
 * CRITICAL: Body must be read as raw text BEFORE any JSON parsing.
 * Using request.json() before signature verification would invalidate
 * the signature because Stripe signs the raw body bytes.
 *
 * This implementation uses Node.js crypto for HMAC verification
 * without requiring the Stripe SDK at build time. When the Stripe SDK
 * is added, replace with stripe.webhooks.constructEvent().
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createHmac } from "node:crypto";
import { timingSafeCompare } from "@/lib/security/timing-safe";

const STRIPE_SIGNATURE_HEADER = "stripe-signature";
const TOLERANCE_SECONDS = 300; // 5 minutes

interface StripeSignatureParts {
  timestamp: number;
  signatures: string[];
}

function parseStripeSignature(header: string): StripeSignatureParts | null {
  let timestamp = 0;
  const signatures: string[] = [];

  for (const part of header.split(",")) {
    const [key, value] = part.split("=");
    if (key === "t" && value) {
      timestamp = parseInt(value, 10);
    } else if (key === "v1" && value) {
      signatures.push(value);
    }
  }

  if (timestamp === 0 || signatures.length === 0) {
    return null;
  }

  return { timestamp, signatures };
}

function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): boolean {
  const parsed = parseStripeSignature(signatureHeader);
  if (!parsed) return false;

  // Check timestamp tolerance to prevent replay attacks
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parsed.timestamp) > TOLERANCE_SECONDS) {
    return false;
  }

  // Compute expected signature: HMAC-SHA256(timestamp + "." + rawBody)
  const signedPayload = `${parsed.timestamp}.${rawBody}`;
  const expected = createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  // Check if any of the provided signatures match (timing-safe)
  return parsed.signatures.some((sig) => timingSafeCompare(sig, expected));
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeWebhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { status: "fail", message: "Webhook not configured" },
      { status: 500 },
    );
  }

  // SEC-007: Read raw body as text FIRST — never call request.json() before this
  const rawBody = await request.text();
  const signature = request.headers.get(STRIPE_SIGNATURE_HEADER);

  if (!signature) {
    return NextResponse.json(
      { status: "fail", message: "Missing Stripe signature" },
      { status: 400 },
    );
  }

  // Verify HMAC signature against raw body
  if (!verifyStripeSignature(rawBody, signature, stripeWebhookSecret)) {
    console.error("Stripe webhook signature verification failed");
    return NextResponse.json(
      { status: "fail", message: "Invalid signature" },
      { status: 400 },
    );
  }

  // Safe to parse JSON now that signature is verified
  let event: { type: string; data: { object: unknown } };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    return NextResponse.json(
      { status: "fail", message: "Invalid JSON body" },
      { status: 400 },
    );
  }

  // Handle events
  switch (event.type) {
    case "payment_intent.succeeded":
      // TODO: Mark booking as paid
      break;
    case "customer.subscription.updated":
      // TODO: Update subscription tier
      break;
    case "customer.subscription.deleted":
      // TODO: Downgrade to free
      break;
    default:
      // Unhandled event type — acknowledge receipt
      break;
  }

  return NextResponse.json({ received: true });
}
