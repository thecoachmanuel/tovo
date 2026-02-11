'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function initializePaystackCheckout({
  amountUsd,
  planKey,
  name,
  email,
}: {
  amountUsd: number;
  planKey: 'pro' | 'business';
  name: string;
  email: string;
}) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Missing PAYSTACK_SECRET_KEY');
  }
  if (!BASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_BASE_URL');
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Convert USD to NGN (simple example: replace with real FX or Price in NGN)
  const ngnAmount = Math.round(amountUsd * 1500); // example conversion
  const amountKobo = ngnAmount * 100;

  const body = {
    amount: amountKobo,
    email,
    currency: 'NGN',
    callback_url: `${BASE_URL}/dashboard`, // redirect after payment
    metadata: {
      user_id: user.id,
      plan: planKey,
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
    throw new Error(json.message || 'Failed to initialize Paystack transaction');
  }

  // Optionally store pending subscription state
  await supabase.auth.updateUser({
    data: {
      subscription_pending: true,
      subscription_plan: planKey,
    },
  });

  return {
    authorization_url: json.data.authorization_url as string,
    reference: json.data.reference as string,
  };
}

export async function verifyPaystackPayment(reference: string) {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Missing PAYSTACK_SECRET_KEY');
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  });
  const json = await res.json();
  if (!res.ok || !json.status) {
    throw new Error(json.message || 'Verification failed');
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
    return { success: true, plan };
  }
  throw new Error('Payment not successful');
}

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing SUPABASE service role configuration');
  }
  return createSupabaseAdmin(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function listUsersAdmin() {
  const admin = getAdminClient();
  const res = await admin.auth.admin.listUsers();
  if ('error' in res && res.error) {
    throw new Error(res.error.message);
  }
  return res.data.users.map((u) => ({
    id: u.id,
    email: u.email,
    username: (u.user_metadata as any)?.username,
    subscription_active: (u.user_metadata as any)?.subscription_active || false,
    subscription_plan: (u.user_metadata as any)?.subscription_plan || 'free',
    subscription_trial_active: (u.user_metadata as any)?.subscription_trial_active || false,
    subscription_trial_end: (u.user_metadata as any)?.subscription_trial_end || null,
  }));
}

export async function adminSetUserPlan(userId: string, plan: 'free' | 'pro' | 'business', active: boolean) {
  const admin = getAdminClient();
  const res = await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      subscription_active: active,
      subscription_plan: plan,
      subscription_provider: active && plan !== 'free' ? 'admin' : null,
      subscription_reference: active && plan !== 'free' ? `admin-${Date.now()}` : null,
    },
  });
  if ('error' in res && res.error) {
    throw new Error(res.error.message);
  }
  return { success: true };
}

type PlanConfig = {
  free: { maxDurationMin: number; maxParticipants: number; recordingsEnabled: boolean; streamingEnabled: boolean; unlimitedOneOnOne: boolean };
  pro: { maxDurationMin: number; maxParticipants: number; recordingsEnabled: boolean; streamingEnabled: boolean; unlimitedOneOnOne: boolean; trialDays?: number; trialChargeEnabled?: boolean; trialChargeNgn?: number };
  business: { maxDurationMin: number; maxParticipants: number; recordingsEnabled: boolean; streamingEnabled: boolean; unlimitedOneOnOne: boolean };
};

const defaultPlanConfig: PlanConfig = {
  free: { maxDurationMin: 40, maxParticipants: 100, recordingsEnabled: false, streamingEnabled: false, unlimitedOneOnOne: true },
  pro: { maxDurationMin: 1440, maxParticipants: 300, recordingsEnabled: true, streamingEnabled: true, unlimitedOneOnOne: true, trialDays: 14, trialChargeEnabled: false, trialChargeNgn: 0 },
  business: { maxDurationMin: 1440, maxParticipants: 1000, recordingsEnabled: true, streamingEnabled: true, unlimitedOneOnOne: true },
};

export async function getGlobalPlanConfig(): Promise<PlanConfig> {
  const admin = getAdminClient();
  const res = await admin.auth.admin.listUsers();
  if ('error' in res && res.error) throw new Error(res.error.message);
  const adminUser = res.data.users.find((u) => (u.user_metadata as any)?.role === 'admin');
  const cfg = (adminUser?.user_metadata as any)?.global_plan_config;
  if (cfg && typeof cfg === 'object') {
    return { ...defaultPlanConfig, ...cfg };
  }
  return defaultPlanConfig;
}

export async function setGlobalPlanConfig(config: PlanConfig) {
  const admin = getAdminClient();
  const res = await admin.auth.admin.listUsers();
  if ('error' in res && res.error) throw new Error(res.error.message);
  const adminUser = res.data.users.find((u) => (u.user_metadata as any)?.role === 'admin');
  if (!adminUser) throw new Error('No admin user found');
  const upd = await admin.auth.admin.updateUserById(adminUser.id, {
    user_metadata: {
      global_plan_config: config,
    },
  });
  if ('error' in upd && upd.error) throw new Error(upd.error.message);
  return { success: true };
}

export async function adminStartProTrial(userId: string) {
  const admin = getAdminClient();
  const cfg = await getGlobalPlanConfig();
  const days = cfg.pro.trialDays ?? 14;
  const chargeEnabled = cfg.pro.trialChargeEnabled ?? false;
  const chargeNgn = cfg.pro.trialChargeNgn ?? 0;
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  const upd = await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      subscription_trial_active: true,
      subscription_trial_plan: 'pro',
      subscription_trial_end: endDate.toISOString(),
      subscription_trial_charge_enabled: chargeEnabled,
      subscription_trial_charge_ngn: chargeEnabled ? chargeNgn : 0,
    },
  });
  if ('error' in upd && upd.error) throw new Error(upd.error.message);
  return { success: true };
}

export async function adminEndTrial(userId: string) {
  const admin = getAdminClient();
  const upd = await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      subscription_trial_active: false,
    },
  });
  if ('error' in upd && upd.error) throw new Error(upd.error.message);
  return { success: true };
}
