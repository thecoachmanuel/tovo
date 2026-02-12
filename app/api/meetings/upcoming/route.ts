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
    const meetings = await db.meeting.findMany({
      where: {
        createdBy: user.id,
        startsAt: { gt: new Date(now.getTime() - 60 * 60 * 1000) },
        endedAt: null,
      },
      orderBy: { startsAt: 'asc' },
      take: 5,
    });
    return NextResponse.json(
      meetings.map((m) => ({
        id: m.id,
        title: m.title,
        startsAt: m.startsAt,
        streamCallId: m.streamCallId,
      })),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30, s-maxage=120, stale-while-revalidate=300',
        },
      },
    );
  } catch {
    return NextResponse.json([], { status: 200, headers: { 'Cache-Control': 'no-store' } });
  }
}
