import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export async function GET(req: NextRequest) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: 'Missing PAYSTACK_SECRET_KEY' }, { status: 500 });
    }
    const reference = req.nextUrl.searchParams.get('reference');
    if (!reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 });
    }
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }
    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });
    const json = await res.json();
    if (!res.ok || !json.status) {
      return NextResponse.json({ error: json.message || 'Verification failed' }, { status: 500 });
    }
    const data = json.data;
    if (data.status === 'success') {
      const plan = (data.metadata?.plan as 'pro' | 'business') || 'pro';
      await supabase.auth.updateUser({
        data: {
          subscription_active: true,
          subscription_pending: false,
          subscription_plan: plan,
          subscription_provider: 'paystack',
          subscription_reference: reference,
          subscription_activated_at: new Date().toISOString(),
        },
      });
      return NextResponse.json({ success: true, plan });
    }
    return NextResponse.json({ error: 'Payment not successful' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Verification error' }, { status: 500 });
  }
}
