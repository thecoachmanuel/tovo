import 'server-only';
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function present(v: string | undefined) {
  return !!(v && v.trim().length > 0);
}

export async function GET() {
  try {
    const NEXT_PUBLIC_STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const STREAM_SECRET_KEY = process.env.STREAM_SECRET_KEY;
    const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

    const looksPk = (NEXT_PUBLIC_STREAM_API_KEY || '').startsWith('pk_');
    const looksSk = (STREAM_SECRET_KEY || '').startsWith('sk_');
    const looksUrl = !!(NEXT_PUBLIC_BASE_URL && /^https?:\/\//.test(NEXT_PUBLIC_BASE_URL));

    return NextResponse.json({
      stream: {
        hasPublicKey: present(NEXT_PUBLIC_STREAM_API_KEY),
        hasSecretKey: present(STREAM_SECRET_KEY),
        looksPk,
        looksSk,
      },
      supabase: {
        hasUrl: present(NEXT_PUBLIC_SUPABASE_URL),
        hasAnon: present(NEXT_PUBLIC_SUPABASE_ANON_KEY),
      },
      paystack: {
        hasSecret: present(PAYSTACK_SECRET_KEY),
      },
      baseUrl: {
        hasBaseUrl: present(NEXT_PUBLIC_BASE_URL),
        looksUrl,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Env debug failed' }, { status: 500 });
  }
}
