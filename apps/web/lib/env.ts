import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default('postgresql://localhost/bookingkit'),
  AUTH_SECRET: z.string().min(1).default('bookingkit-secret-32-chars-minimum-here'),
  RESEND_API_KEY: z.string().optional().default('re_placeholder'),
  STRIPE_SECRET_KEY: z.string().optional().default('sk_placeholder'),
  STRIPE_WEBHOOK_SECRET: z.string().optional().default('whsec_placeholder'),
  STRIPE_PRICE_INDIE: z.string().optional().default('price_indie'),
  STRIPE_PRICE_PRO: z.string().optional().default('price_pro'),
  CRON_SECRET: z.string().optional().default('cron_secret'),
  NEXT_PUBLIC_APP_URL: z.string().optional().default('http://localhost:3000'),
});

export type Env = z.infer<typeof envSchema>;

function getEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid env:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }
  return parsed.data;
}

export const env = getEnv();
