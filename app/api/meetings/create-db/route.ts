import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    const { id, title, startsAt, streamCallId } = await req.json();
    if (!id || !startsAt || !streamCallId) {
      return NextResponse.json({ error: 'Missing id/startsAt/streamCallId' }, { status: 400 });
    }
    const { default: db } = await import('@/lib/db');
    await db.user.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email: user.email || '',
        username: (user.user_metadata as any)?.username || null,
      },
    });
    await db.meeting.create({
      data: {
        id,
        title: title || 'Meeting',
        startsAt: new Date(startsAt),
        streamCallId,
        createdBy: user.id,
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to write meeting to DB' }, { status: 500 });
  }
}
