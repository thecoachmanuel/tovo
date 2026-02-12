import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { meetingId, rttMs, downlinkMbps, jitterMs } = payload || {};
    if (!meetingId) {
      return NextResponse.json({ error: 'Missing meetingId' }, { status: 400 });
    }
    try {
      const { default: db } = await import('@/lib/db');
      await db.meetingQuality.create({
        data: {
          meetingId,
          rttMs: typeof rttMs === 'number' ? rttMs : null,
          downlinkMbps: typeof downlinkMbps === 'number' ? downlinkMbps : null,
          jitterMs: typeof jitterMs === 'number' ? jitterMs : null,
        },
      });
    } catch {
      // swallow DB errors to avoid impacting the call experience
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
