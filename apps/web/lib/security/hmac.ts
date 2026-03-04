/**
 * SEC-005: HMAC-SHA256 signing for outgoing webhooks.
 * Signs payload with workspace webhook secret, sets X-BookingKit-Signature header.
 */

import { createHmac } from "node:crypto";

export function signWebhookPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

export function buildSignatureHeader(
  timestamp: number,
  signature: string,
): string {
  return `t=${timestamp},v1=${signature}`;
}

export interface WebhookDeliveryOptions {
  url: string;
  event: string;
  payload: Record<string, unknown>;
  secret: string;
}

export async function deliverWebhook(
  options: WebhookDeliveryOptions,
): Promise<{ status: number; ok: boolean }> {
  const timestamp = Math.floor(Date.now() / 1000);
  const body = JSON.stringify(options.payload);

  // Sign: timestamp + "." + body
  const signedContent = `${timestamp}.${body}`;
  const signature = signWebhookPayload(signedContent, options.secret);

  const response = await fetch(options.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-BookingKit-Signature": buildSignatureHeader(timestamp, signature),
      "X-BookingKit-Event": options.event,
    },
    body,
    signal: AbortSignal.timeout(10_000),
  });

  return { status: response.status, ok: response.ok };
}
