'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminSetUserPlan, adminStartProTrial, listUsersAdmin } from '@/actions/billing.actions';
import { Button } from '@/components/ui/button';
import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import Alert from '@/components/Alert';
import Link from 'next/link';

type UserRow = {
  id: string;
  email: string | undefined;
  username?: string;
  subscription_active: boolean;
  subscription_plan: 'free' | 'pro' | 'business';
  subscription_trial_active?: boolean;
  subscription_trial_end?: string;
};

export default function AdminUsersPage() {
  const { user, isLoaded } = useSupabaseUser();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'pro' | 'business'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await listUsersAdmin();
        setUsers(data);
      } catch (e) {
        toast({ title: 'Failed to load users', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const updatePlan = async (u: UserRow, plan: 'free' | 'pro' | 'business', active: boolean) => {
    try {
      setLoading(true);
      await adminSetUserPlan(u.id, plan, active);
      toast({ title: 'Plan updated', description: `${u.email || u.username} set to ${plan}` });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, subscription_plan: plan, subscription_active: active } : x)));
    } catch (e) {
      toast({ title: 'Failed to update plan', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQuery =
        !q ||
        (u.email ? u.email.toLowerCase().includes(q) : false) ||
        (u.username ? u.username.toLowerCase().includes(q) : false);
      const matchesPlan = planFilter === 'all' || u.subscription_plan === planFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' ? u.subscription_active : !u.subscription_active);
      return matchesQuery && matchesPlan && matchesStatus;
    });
  }, [users, query, planFilter, statusFilter]);

  if (!isLoaded) return null;
  if (!user || user.user_metadata?.role !== 'admin') {
    return <Alert title="Admin access required" />;
  }
  return (
    <section className="flex size-full flex-col gap-6 text-black dark:text-white p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manage Users</h1>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-lg bg-blue-1 px-4 py-2 text-white hover:bg-blue-700"
        >
          Admin Dashboard
        </Link>
      </div>
      <div className="flex flex-col md:flex-row gap-3 md:items-end">
        <div className="flex-1">
          <label className="text-sm">Search</label>
          <Input
            placeholder="Filter by email or username"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="mt-1"
          />
        </div>
        <div className="w-full md:w-[200px]">
          <label className="text-sm">Plan</label>
          <Combobox
            options={[
              { value: 'all', label: 'All' },
              { value: 'free', label: 'Free' },
              { value: 'pro', label: 'Pro' },
              { value: 'business', label: 'Business' },
            ]}
            value={planFilter}
            onValueChange={(v) => setPlanFilter(v as any)}
            inputPlaceholder="Select plan..."
            className="mt-1"
          />
        </div>
        <div className="w-full md:w-[200px]">
          <label className="text-sm">Subscription</label>
          <Combobox
            options={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as any)}
            inputPlaceholder="Select subscription..."
            className="mt-1"
          />
        </div>
      </div>
      <div className="rounded-2xl border border-gray-200 dark:border-dark-3 bg-white dark:bg-dark-1 overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-5 gap-2 p-4 text-sm font-semibold">
            <div>Email</div>
            <div>Username</div>
            <div>Plan</div>
            <div>Subscription</div>
            <div>Actions</div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-dark-3">
            {filtered.map((u) => (
              <div key={u.id} className="grid grid-cols-5 gap-2 p-4 items-center">
                <div className="truncate">{u.email}</div>
                <div className="truncate">{u.username || '-'}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Combobox
                    options={[
                      { value: 'free', label: 'Free' },
                      { value: 'pro', label: 'Pro' },
                      { value: 'business', label: 'Business' },
                    ]}
                    value={u.subscription_plan}
                    onValueChange={(v) => updatePlan(u, v as any, v !== 'free')}
                    className="w-full sm:w-[160px]"
                    inputPlaceholder="Search plan..."
                  />
                </div>
                <div className={`text-sm ${u.subscription_active ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                  {u.subscription_active ? 'Active' : 'Inactive'}
                  {u.subscription_trial_active && (
                    <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                      Trial until {u.subscription_trial_end ? new Date(u.subscription_trial_end).toLocaleDateString() : ''}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="text-black dark:text-white"
                    onClick={() => updatePlan(u, 'free', false)}
                    disabled={loading}
                  >
                    Set Free
                  </Button>
                  <Button className="bg-blue-1" onClick={() => updatePlan(u, 'pro', true)} disabled={loading}>
                    Set Pro
                  </Button>
                  <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => updatePlan(u, 'business', true)} disabled={loading}>
                    Set Business
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        setLoading(true);
                        await adminStartProTrial(u.id);
                        toast({ title: 'Pro trial started' });
                        setUsers((prev) =>
                          prev.map((x) =>
                            x.id === u.id
                              ? { ...x, subscription_trial_active: true, subscription_trial_end: new Date(Date.now() + (14 * 24 * 60 * 60 * 1000)).toISOString() }
                              : x
                          )
                        );
                      } catch {
                        toast({ title: 'Failed to start trial', variant: 'destructive' });
                      } finally {
                        setLoading(false);
                      }
                    }}
                    disabled={loading}
                  >
                    Start Pro Trial
                  </Button>
                  {u.subscription_trial_active && (
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          setLoading(true);
                          const res = await fetch('/api/admin/charge-trial', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: u.id }),
                          });
                          const json = await res.json();
                          if (!res.ok) {
                            toast({ title: 'Trial charge failed', description: json.error || 'Error', variant: 'destructive' });
                            return;
                          }
                          toast({ title: 'Trial charge link ready' });
                          if (typeof window !== 'undefined') {
                            window.open(json.authorization_url, '_blank');
                          }
                        } catch {
                          toast({ title: 'Trial charge error', variant: 'destructive' });
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                    >
                      Charge Trial Fee
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
