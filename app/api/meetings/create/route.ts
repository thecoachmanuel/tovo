import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';
import { StreamClient } from '@stream-io/node-sdk';

const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_SECRET_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    const apiKey = (STREAM_API_KEY || '').trim();
    const apiSecret = (STREAM_API_SECRET || '').trim();
    if (!apiKey || !apiSecret || /your.*key/i.test(apiKey) || /your.*secret/i.test(apiSecret)) {
      return NextResponse.json(
        {
          error: 'Missing Stream config',
          hint: 'Set NEXT_PUBLIC_STREAM_API_KEY and STREAM_SECRET_KEY in .env.local, then restart the server.',
        },
        { status: 500 }
      );
    }
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const { description, startsAt, instant } = await req.json();
    const id = crypto.randomUUID();
    const startsISO = startsAt ? new Date(startsAt).toISOString() : new Date().toISOString();

    const streamClient = new StreamClient(apiKey, apiSecret);
    const call = streamClient.video.call('default', id);
    await call.getOrCreate({
      data: {
        starts_at: new Date(startsISO),
        custom: {
          description: description || (instant ? 'Instant Meeting' : 'Scheduled Meeting'),
          starts_at: startsISO,
        },
      },
    });

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
        title: description || (instant ? 'Instant Meeting' : 'Scheduled Meeting'),
        startsAt: new Date(startsISO),
        streamCallId: id,
        createdBy: user.id,
      },
    });

    return NextResponse.json({
      id,
      startsAt: startsISO,
      title: description || (instant ? 'Instant Meeting' : 'Scheduled Meeting'),
      meetingLink: `${BASE_URL}/meeting/${id}`,
    });
  } catch (error) {
    const message = (error as Error)?.message || 'Failed to create meeting';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
