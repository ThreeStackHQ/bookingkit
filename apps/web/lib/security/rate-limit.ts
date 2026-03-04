/**
 * SEC-001: In-memory sliding-window rate limiter.
 * 10 requests per minute per IP on booking endpoints.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000; // 1 minute
const CLEANUP_INTERVAL_MS = 300_000; // 5 minutes

// Periodic cleanup to prevent memory leaks
if (typeof globalThis !== "undefined") {
  const g = globalThis as unknown as { _rateLimitCleanup?: NodeJS.Timeout };
  if (!g._rateLimitCleanup) {
    g._rateLimitCleanup = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of store) {
        entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);
        if (entry.timestamps.length === 0) {
          store.delete(key);
        }
      }
    }, CLEANUP_INTERVAL_MS);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = WINDOW_MS,
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key) ?? { timestamps: [] };

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0]!;
    const retryAfterMs = windowMs - (now - oldestInWindow);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  entry.timestamps.push(now);
  store.set(key, entry);

  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    retryAfterMs: 0,
  };
}

export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers);
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headers.get("x-real-ip") ??
    "unknown"
  );
}
