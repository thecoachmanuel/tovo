import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { getGlobalPlanConfig } from '@/actions/billing.actions';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE service role configuration');
  }
  return createSupabaseAdmin(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!PAYSTACK_SECRET_KEY || !BASE_URL) {
      return NextResponse.json({ error: 'Missing Paystack/BASE_URL config' }, { status: 500 });
    }
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const cfg = await getGlobalPlanConfig();
    const chargeEnabled = cfg.pro.trialChargeEnabled ?? false;
    const chargeNgn = cfg.pro.trialChargeNgn ?? 0;
    if (!chargeEnabled || chargeNgn <= 0) {
      return NextResponse.json({ error: 'Trial charge disabled or zero amount' }, { status: 400 });
    }

    const admin = getAdminClient();
    const userRes = await admin.auth.admin.getUserById(userId);
    if ('error' in userRes && userRes.error) {
      return NextResponse.json({ error: userRes.error.message }, { status: 500 });
    }
    const target = userRes.data.user;
    const email = target.email;
    const name = ((target.user_metadata as any)?.username as string) || email || 'User';
    if (!email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 });
    }

    const amountKobo = Math.round(chargeNgn) * 100;
    const body = {
      amount: amountKobo,
      email,
      currency: 'NGN',
      callback_url: `${BASE_URL}/profile`,
      metadata: {
        user_id: userId,
        type: 'trial_fee',
        plan: 'pro',
        name,
        email,
      },
    };

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok || !json.status) {
      return NextResponse.json({ error: json.message || 'Failed to init trial charge' }, { status: 500 });
    }
    return NextResponse.json({
      authorization_url: json.data.authorization_url as string,
      reference: json.data.reference as string,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to initialize trial charge' }, { status: 500 });
  }
}
