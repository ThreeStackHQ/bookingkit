import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import { db } from '@/lib/db';
import { calendars, workspaces, availabilityOverrides } from '@bookingkit/db';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

async function getWorkspace(userId: string) {
  const [ws] = await db.select().from(workspaces).where(eq(workspaces.ownerId, userId)).limit(1);
  return ws;
}

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

  const overrides = await db.select().from(availabilityOverrides)
    .where(eq(availabilityOverrides.calendarId, id));

  return NextResponse.json({ overrides });
}

const upsertSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isBlocked: z.boolean().optional().default(false),
  customStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  customEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export async function PUT(
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
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [override] = await db.insert(availabilityOverrides).values({
    calendarId: id,
    ...parsed.data,
  }).onConflictDoUpdate({
    target: [availabilityOverrides.calendarId, availabilityOverrides.date],
    set: {
      isBlocked: parsed.data.isBlocked,
      customStart: parsed.data.customStart ?? null,
      customEnd: parsed.data.customEnd ?? null,
    },
  }).returning();

  return NextResponse.json({ override });
}
