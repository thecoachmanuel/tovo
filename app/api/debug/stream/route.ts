import 'server-only';
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { StreamClient } from '@stream-io/node-sdk';

export async function GET() {
  try {
    const apiKey = (process.env.NEXT_PUBLIC_STREAM_API_KEY || '').trim();
    const apiSecret = (process.env.STREAM_SECRET_KEY || '').trim();
    const hasKey = !!apiKey;
    const hasSecret = !!apiSecret;
    const looksPk = apiKey.startsWith('pk_');
    const looksSk = apiSecret.startsWith('sk_');

    let tokenCreatable = false;
    let handshakeOk = false;
    let handshakeError: string | null = null;

    try {
      if (hasKey && hasSecret) {
        const client = new StreamClient(apiKey, apiSecret);
        const token = client.createToken('debug');
        tokenCreatable = typeof token === 'string' && token.length > 0;
        const call = client.video.call('default', 'env-check');
        await call.getOrCreate({ data: { starts_at: new Date() } });
        handshakeOk = true;
      }
    } catch (e) {
      handshakeError = (e as Error)?.message || 'Unknown error';
    }

    return NextResponse.json({
      hasKey,
      hasSecret,
      looksPk,
      looksSk,
      tokenCreatable,
      handshakeOk,
      handshakeError,
    });
  } catch {
    return NextResponse.json({ error: 'Stream debug failed' }, { status: 500 });
  }
}
