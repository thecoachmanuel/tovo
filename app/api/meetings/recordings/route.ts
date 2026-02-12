import 'server-only';
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';
import { StreamClient } from '@stream-io/node-sdk';

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_SECRET_KEY;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json([], { status: 200, headers: { 'Cache-Control': 'no-store' } });
    }
    if (!STREAM_API_KEY || !STREAM_API_SECRET) {
      return NextResponse.json([], { status: 200, headers: { 'Cache-Control': 'no-store' } });
    }

    const { default: db } = await import('@/lib/db');
    const recentMeetings = await db.meeting.findMany({
      where: { createdBy: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const client = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);
    const recordings: Array<{ filename?: string; url?: string; start_time?: string }> = [];
    for (const m of recentMeetings) {
      try {
        const call = client.video.call('default', m.streamCallId);
        // @ts-ignore - Node SDK supports querying recordings
        const res = await call.queryRecordings();
        if (res?.recordings?.length) {
          for (const r of res.recordings) {
            recordings.push({
              filename: r.filename,
              url: r.url,
              start_time: r.start_time,
            });
          }
        }
      } catch {
        // ignore per-call failures
      }
    }

    return NextResponse.json(recordings, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=120, s-maxage=600, stale-while-revalidate=1200',
      },
    });
  } catch {
    return NextResponse.json([], { status: 200, headers: { 'Cache-Control': 'no-store' } });
  }
}
