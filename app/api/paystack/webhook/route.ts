import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import crypto from 'crypto';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      return NextResponse.json({ error: 'Missing PAYSTACK_SECRET_KEY' }, { status: 500 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature') || '';
    const computed = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(rawBody).digest('hex');

    if (signature !== computed) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    if (event.event === 'charge.success' && event.data?.status === 'success') {
      const metadata = event.data?.metadata || {};
      const userId = metadata.user_id as string | undefined;
      const plan = metadata.plan as 'free' | 'pro' | 'business' | undefined;
      const type = (metadata.type as string | undefined) || 'subscription';

      if (userId && plan) {
        if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
          return NextResponse.json({ error: 'Missing supabase service role env' }, { status: 500 });
        }
        const admin = createSupabaseAdmin(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
        if (type === 'trial_fee') {
          await admin.auth.admin.updateUserById(userId, {
            user_metadata: {
              subscription_trial_fee_paid: true,
              subscription_trial_fee_reference: event.data.reference,
              subscription_trial_fee_amount_ngn: event.data.amount / 100,
            },
          });
        } else {
          await admin.auth.admin.updateUserById(userId, {
            user_metadata: {
              subscription_active: true,
              subscription_pending: false,
              subscription_plan: plan === 'free' ? 'pro' : plan,
              subscription_provider: 'paystack',
              subscription_reference: event.data.reference,
              subscription_activated_at: new Date().toISOString(),
            },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}
