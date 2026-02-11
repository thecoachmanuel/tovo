'use client';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import Alert from '@/components/Alert';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const { user, isLoaded } = useSupabaseUser();
  type Stats = {
    activeUsers: number;
    activeMeetings: number;
    revenue: { mrrUsd: number; currency?: string };
    totals?: { users: number };
    breakdown?: { pro: number; business: number };
    newUsersLast7d?: number;
    newSubsLast7d?: number;
    trialsActive?: number;
    avgDurationMin?: number;
    meetingsPerDay?: Array<{ day: string; count: number }>;
  };
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/stats', { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) {
          setError(json.error || 'Failed to load stats');
          return;
        }
        setStats(json);
      } catch {
        setError('Failed to load stats');
      }
    })();
  }, []);
  if (!isLoaded) return null;
  if (!user || user.user_metadata?.role !== 'admin') {
    return <Alert title="Admin access required" />;
  }
  return (
    <section className="flex size-full flex-col gap-10 text-white p-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
         <Card className="bg-dark-1 border-none text-white">
            <CardHeader>
                <CardTitle>Active Users</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-4xl font-bold">{stats ? stats.activeUsers : '—'}</p>
            </CardContent>
         </Card>
         <Card className="bg-dark-1 border-none text-white">
            <CardHeader>
                <CardTitle>Active Meetings</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-4xl font-bold">{stats ? stats.activeMeetings : '—'}</p>
            </CardContent>
         </Card>
         <Card className="bg-dark-1 border-none text-white">
            <CardHeader>
                <CardTitle>Revenue</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-4xl font-bold">{stats ? `$${stats.revenue.mrrUsd}` : '$—'}</p>
                {error && <p className="text-sm text-red-400 mt-2">{error}</p>}
            </CardContent>
         </Card>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="bg-dark-1 border-none text-white">
          <CardHeader>
            <CardTitle>Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats ? (stats.totals?.users ?? '—') : '—'}</p>
          </CardContent>
        </Card>
        <Card className="bg-dark-1 border-none text-white">
          <CardHeader>
            <CardTitle>New Users (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats ? (stats.newUsersLast7d ?? '—') : '—'}</p>
          </CardContent>
        </Card>
        <Card className="bg-dark-1 border-none text-white">
          <CardHeader>
            <CardTitle>New Subscriptions (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats ? (stats.newSubsLast7d ?? '—') : '—'}</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <Card className="bg-dark-1 border-none text-white">
          <CardHeader>
            <CardTitle>Active Trials</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats ? (stats.trialsActive ?? '—') : '—'}</p>
          </CardContent>
        </Card>
        <Card className="bg-dark-1 border-none text-white">
          <CardHeader>
            <CardTitle>Pro vs Business</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mt-2">
              <div className="text-sm">Pro</div>
              <div className="h-2 bg-dark-3 rounded">
                <div
                  className="h-2 bg-blue-500 rounded"
                  style={{ width: `${stats ? Math.min(100, (stats.breakdown?.pro ?? 0) * 10) : 0}%` }}
                />
              </div>
              <div className="text-sm mt-2">Business</div>
              <div className="h-2 bg-dark-3 rounded">
                <div
                  className="h-2 bg-purple-600 rounded"
                  style={{ width: `${stats ? Math.min(100, (stats.breakdown?.business ?? 0) * 10) : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-dark-1 border-none text-white">
          <CardHeader>
            <CardTitle>Avg Meeting Duration (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats ? `${stats.avgDurationMin}m` : '—'}</p>
            <div className="mt-4 flex items-end gap-1 h-16">
              {stats?.meetingsPerDay?.map((d: any, i: number) => (
                <div
                  key={i}
                  className="bg-blue-500/70 w-4 rounded-sm"
                  style={{ height: `${Math.min(64, (d.count || 0) * 8)}px` }}
                  title={`${d.day}: ${d.count}`}
                />
              )) || null}
            </div>
            <p className="text-xs text-gray-400 mt-2">Meetings per day (last 7 days)</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-4">
         <Link href="/admin/users" className="bg-blue-1 px-6 py-3 rounded-lg hover:bg-blue-700">
            Manage Users
         </Link>
         <Link href="/admin/settings" className="bg-dark-3 px-6 py-3 rounded-lg hover:bg-dark-4">
            Site Settings
         </Link>
      </div>
    </section>
  );
}
