import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../auth';
import { db } from '@/lib/db';
import { calendars, workspaces } from '@bookingkit/db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { getTierLimits } from '@/lib/tier';
import type { Plan } from '@/lib/tier';

async function getWorkspace(userId: string) {
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.ownerId, userId)).limit(1);
  return ws;
}

const createSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  durationMinutes: z.number().int().min(5).max(480).optional(),
  bufferMinutes: z.number().int().min(0).max(120).optional(),
  maxAdvanceDays: z.number().int().min(1).max(365).optional(),
  minNoticeHours: z.number().int().min(0).max(72).optional(),
  timezone: z.string().optional(),
  weeklyAvailability: z.record(z.string(), z.object({
    start: z.string(),
    end: z.string(),
    enabled: z.boolean(),
  })).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ws = await getWorkspace(session.user.id);
  if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

  const rows = await db.select().from(calendars)
    .where(and(eq(calendars.workspaceId, ws.id), eq(calendars.active, true)));

  return NextResponse.json({ calendars: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ws = await getWorkspace(session.user.id);
  if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

  const limits = getTierLimits(ws.plan as Plan);
  const existing = await db.select().from(calendars)
    .where(and(eq(calendars.workspaceId, ws.id), eq(calendars.active, true)));

  const maxCals = limits.calendars === Infinity ? 9999 : limits.calendars;
  if (existing.length >= maxCals) {
    return NextResponse.json({
      error: 'Calendar limit reached for your plan',
      upgradeUrl: '/billing',
    }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [calendar] = await db.insert(calendars).values({
    workspaceId: ws.id,
    ...parsed.data,
  }).returning();

  return NextResponse.json({ calendar }, { status: 201 });
}
