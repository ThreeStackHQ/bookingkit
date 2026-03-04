/**
 * SEC-012: Timing-safe string comparison.
 * Prevents timing attacks on secret comparison (cron secrets, tokens, etc.).
 */

import { timingSafeEqual } from "node:crypto";

export function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Compare against itself to burn equal time, then return false
    const buf = Buffer.from(a, "utf8");
    timingSafeEqual(buf, buf);
    return false;
  }

  return timingSafeEqual(Buffer.from(a, "utf8"), Buffer.from(b, "utf8"));
}
