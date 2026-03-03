import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { db } from '@/lib/db';
import { calendars, workspaces } from '@bookingkit/db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

async function getWorkspace(userId: string) {
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.ownerId, userId)).limit(1);
  return ws;
}

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  slug: z.string().min(1).max(60).regex(/^[a-z0-9-]+$/).optional(),
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

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const ws = await getWorkspace(session.user.id);
  if (!ws) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [cal] = await db.select().from(calendars)
    .where(and(eq(calendars.id, id), eq(calendars.workspaceId, ws.id))).limit(1);
  if (!cal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ calendar: cal });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const ws = await getWorkspace(session.user.id);
  if (!ws) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [cal] = await db.select().from(calendars)
    .where(and(eq(calendars.id, id), eq(calendars.workspaceId, ws.id))).limit(1);
  if (!cal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [updated] = await db.update(calendars).set(parsed.data)
    .where(eq(calendars.id, id)).returning();
  return NextResponse.json({ calendar: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const ws = await getWorkspace(session.user.id);
  if (!ws) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [cal] = await db.select().from(calendars)
    .where(and(eq(calendars.id, id), eq(calendars.workspaceId, ws.id))).limit(1);
  if (!cal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await db.update(calendars).set({ active: false }).where(eq(calendars.id, id));
  return NextResponse.json({ success: true });
}
