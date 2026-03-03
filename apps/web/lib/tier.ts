export const TIERS = {
  free: { calendars: 1, bookingsPerMonth: 10 },
  indie: { calendars: 5, bookingsPerMonth: Infinity },
  pro: { calendars: Infinity, bookingsPerMonth: Infinity },
} as const;

export type Plan = keyof typeof TIERS;

export function getTierLimits(plan: Plan) {
  return TIERS[plan] ?? TIERS.free;
}
