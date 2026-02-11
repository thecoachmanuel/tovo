import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const meetings = await db.meeting.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(meetings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
  }
}
