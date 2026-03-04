import { z } from "zod";

/**
 * SEC-006: All security-critical secrets must be at least 32 characters.
 * AUTH_SECRET (NEXTAUTH_SECRET equivalent), WEBHOOK_SECRET, and CRON_SECRET
 * are enforced at startup to prevent weak secret deployment.
 */
const secret32 = z.string().min(32, {
  message: "Secret must be at least 32 characters for security",
});

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: secret32, // SEC-006: min 32 chars
  RESEND_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  WEBHOOK_SECRET: secret32.optional(), // SEC-006: min 32 chars when set
  CRON_SECRET: secret32.optional(), // SEC-006: min 32 chars when set
});

export type Env = z.infer<typeof envSchema>;

function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

export const env = getEnv();
