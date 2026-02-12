import 'server-only';
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json([], { status: 200, headers: { 'Cache-Control': 'no-store' } });
    }
    const { default: db } = await import('@/lib/db');
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const meetings = await db.meeting.findMany({
      where: {
        createdBy: user.id,
        OR: [
          { endedAt: { not: null } },
          { startsAt: { lt: oneHourAgo } },
        ],
      },
      orderBy: { startsAt: 'desc' },
      take: 10,
    });
    return NextResponse.json(
      meetings.map((m) => ({
        id: m.id,
        title: m.title,
        startsAt: m.startsAt,
        streamCallId: m.streamCallId,
        endedAt: m.endedAt,
      })),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
        },
      },
    );
  } catch {
    return NextResponse.json([], { status: 200, headers: { 'Cache-Control': 'no-store' } });
  }
}
