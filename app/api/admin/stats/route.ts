import 'server-only';
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

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

export async function GET() {
  try {
    const { default: db } = await import('@/lib/db');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.user_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = getAdminClient();
    const res = await admin.auth.admin.listUsers();
    if ('error' in res && res.error) {
      return NextResponse.json({ error: res.error.message }, { status: 500 });
    }

    const users = res.data.users.map((u) => ({
      subscription_active: (u.user_metadata as any)?.subscription_active || false,
      subscription_plan: ((u.user_metadata as any)?.subscription_plan as 'free' | 'pro' | 'business') || 'free',
      created_at: (u as any).created_at ? new Date((u as any).created_at) : null,
      subscription_activated_at: (u.user_metadata as any)?.subscription_activated_at ? new Date((u.user_metadata as any).subscription_activated_at) : null,
      trial_active: (u.user_metadata as any)?.subscription_trial_active || false,
      trial_end: (u.user_metadata as any)?.subscription_trial_end ? new Date((u.user_metadata as any).subscription_trial_end) : null,
    }));

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const activeUsers = users.filter((u) => u.subscription_active).length;
    const totalUsers = users.length;
    const newUsersLast7d = users.filter((u) => u.created_at && u.created_at >= sevenDaysAgo).length;
    const newSubsLast7d = users.filter((u) => u.subscription_activated_at && u.subscription_activated_at >= sevenDaysAgo).length;
    const proCount = users.filter((u) => u.subscription_active && u.subscription_plan === 'pro').length;
    const bizCount = users.filter((u) => u.subscription_active && u.subscription_plan === 'business').length;

    const activeMeetings = await db.meeting.count({
      where: { endedAt: null },
    });
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentMeetings = await db.meeting.findMany({
      where: { createdAt: { gte: weekAgo } },
      select: { startsAt: true, endedAt: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
    const avgDurationMin = (() => {
      const durations = recentMeetings
        .filter((m) => m.endedAt)
        .map((m) => (m.endedAt!.getTime() - m.startsAt.getTime()) / 60000);
      if (!durations.length) return 0;
      return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    })();
    const meetingsPerDay = (() => {
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekAgo);
        d.setDate(weekAgo.getDate() + i);
        return d.toISOString().slice(0, 10);
      });
      const counts: Record<string, number> = {};
      days.forEach((d) => (counts[d] = 0));
      recentMeetings.forEach((m) => {
        const key = m.createdAt.toISOString().slice(0, 10);
        if (counts[key] != null) counts[key] += 1;
      });
      return days.map((d) => ({ day: d, count: counts[d] }));
    })();

    const priceUsd = { pro: 15, business: 35 };
    const mrrUsd = proCount * priceUsd.pro + bizCount * priceUsd.business;

    const trialsActive = users.filter((u) => u.trial_active && u.trial_end && u.trial_end > now).length;

    return NextResponse.json({
      totals: { users: totalUsers },
      activeUsers,
      activeMeetings,
      revenue: { mrrUsd, currency: 'USD' },
      breakdown: { pro: proCount, business: bizCount },
      newUsersLast7d,
      newSubsLast7d,
      trialsActive,
      avgDurationMin,
      meetingsPerDay,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
