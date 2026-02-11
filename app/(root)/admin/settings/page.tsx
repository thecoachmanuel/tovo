'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { getGlobalPlanConfig, setGlobalPlanConfig } from '@/actions/billing.actions';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import Alert from '@/components/Alert';
import Link from 'next/link';

export default function AdminSettingsPage() {
  const { user, isLoaded } = useSupabaseUser();
  const [freeDuration, setFreeDuration] = useState(40);
  const [freeParticipants, setFreeParticipants] = useState(100);
  const [proDuration, setProDuration] = useState(1440);
  const [proParticipants, setProParticipants] = useState(300);
  const [bizDuration, setBizDuration] = useState(1440);
  const [bizParticipants, setBizParticipants] = useState(1000);
  const [freeRecordings, setFreeRecordings] = useState(false);
  const [freeStreaming, setFreeStreaming] = useState(false);
  const [freeOneOnOneUnlimited, setFreeOneOnOneUnlimited] = useState(true);
  const [proRecordings, setProRecordings] = useState(true);
  const [proStreaming, setProStreaming] = useState(true);
  const [proOneOnOneUnlimited, setProOneOnOneUnlimited] = useState(true);
  const [proTrialDays, setProTrialDays] = useState(14);
  const [proTrialChargeEnabled, setProTrialChargeEnabled] = useState(false);
  const [proTrialChargeNgn, setProTrialChargeNgn] = useState(0);
  const [bizRecordings, setBizRecordings] = useState(true);
  const [bizStreaming, setBizStreaming] = useState(true);
  const [bizOneOnOneUnlimited, setBizOneOnOneUnlimited] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const cfg = await getGlobalPlanConfig();
        setFreeDuration(cfg.free.maxDurationMin);
        setFreeParticipants(cfg.free.maxParticipants);
        setFreeRecordings(cfg.free.recordingsEnabled);
        setFreeStreaming(cfg.free.streamingEnabled);
        setFreeOneOnOneUnlimited(cfg.free.unlimitedOneOnOne);
        setProDuration(cfg.pro.maxDurationMin);
        setProParticipants(cfg.pro.maxParticipants);
        setProRecordings(cfg.pro.recordingsEnabled);
        setProStreaming(cfg.pro.streamingEnabled);
        setProOneOnOneUnlimited(cfg.pro.unlimitedOneOnOne);
        setProTrialDays(cfg.pro.trialDays ?? 14);
        setProTrialChargeEnabled(cfg.pro.trialChargeEnabled ?? false);
        setProTrialChargeNgn(cfg.pro.trialChargeNgn ?? 0);
        setBizDuration(cfg.business.maxDurationMin);
        setBizParticipants(cfg.business.maxParticipants);
        setBizRecordings(cfg.business.recordingsEnabled);
        setBizStreaming(cfg.business.streamingEnabled);
        setBizOneOnOneUnlimited(cfg.business.unlimitedOneOnOne);
      } catch {
        toast({ title: 'Failed to load settings', variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const save = async () => {
    try {
      setLoading(true);
      await setGlobalPlanConfig({
        free: { maxDurationMin: freeDuration, maxParticipants: freeParticipants, recordingsEnabled: freeRecordings, streamingEnabled: freeStreaming, unlimitedOneOnOne: freeOneOnOneUnlimited },
        pro: { maxDurationMin: proDuration, maxParticipants: proParticipants, recordingsEnabled: proRecordings, streamingEnabled: proStreaming, unlimitedOneOnOne: proOneOnOneUnlimited, trialDays: proTrialDays, trialChargeEnabled: proTrialChargeEnabled, trialChargeNgn: proTrialChargeNgn },
        business: { maxDurationMin: bizDuration, maxParticipants: bizParticipants, recordingsEnabled: bizRecordings, streamingEnabled: bizStreaming, unlimitedOneOnOne: bizOneOnOneUnlimited },
      });
      toast({ title: 'Settings saved' });
    } catch {
      toast({ title: 'Failed to save settings', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return null;
  if (!user || user.user_metadata?.role !== 'admin') {
    return <Alert title="Admin access required" />;
  }
  return (
    <section className="flex size-full flex-col gap-6 text-black dark:text-white p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Plan Settings</h1>
        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-lg bg-blue-1 px-4 py-2 text-white hover:bg-blue-700"
        >
          Admin Dashboard
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-gray-200 dark:border-dark-3 bg-white dark:bg-dark-1 p-4">
          <h2 className="text-xl font-semibold">Free</h2>
          <div className="mt-4 space-y-3">
            <label className="text-sm">Max Duration (min)</label>
            <Input type="number" value={freeDuration} onChange={(e) => setFreeDuration(parseInt(e.target.value || '0'))} />
            <label className="text-sm">Max Participants</label>
            <Input type="number" value={freeParticipants} onChange={(e) => setFreeParticipants(parseInt(e.target.value || '0'))} />
            <label className="text-sm mt-3">Recordings Enabled</label>
            <input type="checkbox" checked={freeRecordings} onChange={(e) => setFreeRecordings(e.target.checked)} />
            <label className="text-sm mt-3">Streaming Enabled</label>
            <input type="checkbox" checked={freeStreaming} onChange={(e) => setFreeStreaming(e.target.checked)} />
            <label className="text-sm mt-3">One-on-one Unlimited</label>
            <input type="checkbox" checked={freeOneOnOneUnlimited} onChange={(e) => setFreeOneOnOneUnlimited(e.target.checked)} />
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-dark-3 bg-white dark:bg-dark-1 p-4">
          <h2 className="text-xl font-semibold">Pro</h2>
          <div className="mt-4 space-y-3">
            <label className="text-sm">Max Duration (min)</label>
            <Input type="number" value={proDuration} onChange={(e) => setProDuration(parseInt(e.target.value || '0'))} />
            <label className="text-sm">Max Participants</label>
            <Input type="number" value={proParticipants} onChange={(e) => setProParticipants(parseInt(e.target.value || '0'))} />
            <label className="text-sm mt-3">Recordings Enabled</label>
            <input type="checkbox" checked={proRecordings} onChange={(e) => setProRecordings(e.target.checked)} />
            <label className="text-sm mt-3">Streaming Enabled</label>
            <input type="checkbox" checked={proStreaming} onChange={(e) => setProStreaming(e.target.checked)} />
            <label className="text-sm mt-3">One-on-one Unlimited</label>
            <input type="checkbox" checked={proOneOnOneUnlimited} onChange={(e) => setProOneOnOneUnlimited(e.target.checked)} />
            <div className="mt-4 border-t pt-4">
              <h3 className="text-sm font-semibold">Trial Settings</h3>
              <label className="text-sm mt-2">Trial Days</label>
              <Input type="number" value={proTrialDays} onChange={(e) => setProTrialDays(parseInt(e.target.value || '0'))} />
              <label className="text-sm mt-3">Charge Enabled</label>
              <input type="checkbox" checked={proTrialChargeEnabled} onChange={(e) => setProTrialChargeEnabled(e.target.checked)} />
              <label className="text-sm mt-3">Charge Amount (NGN)</label>
              <Input type="number" value={proTrialChargeNgn} onChange={(e) => setProTrialChargeNgn(parseInt(e.target.value || '0'))} />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-dark-3 bg-white dark:bg-dark-1 p-4">
          <h2 className="text-xl font-semibold">Business</h2>
          <div className="mt-4 space-y-3">
            <label className="text-sm">Max Duration (min)</label>
            <Input type="number" value={bizDuration} onChange={(e) => setBizDuration(parseInt(e.target.value || '0'))} />
            <label className="text-sm">Max Participants</label>
            <Input type="number" value={bizParticipants} onChange={(e) => setBizParticipants(parseInt(e.target.value || '0'))} />
            <label className="text-sm mt-3">Recordings Enabled</label>
            <input type="checkbox" checked={bizRecordings} onChange={(e) => setBizRecordings(e.target.checked)} />
            <label className="text-sm mt-3">Streaming Enabled</label>
            <input type="checkbox" checked={bizStreaming} onChange={(e) => setBizStreaming(e.target.checked)} />
            <label className="text-sm mt-3">One-on-one Unlimited</label>
            <input type="checkbox" checked={bizOneOnOneUnlimited} onChange={(e) => setBizOneOnOneUnlimited(e.target.checked)} />
          </div>
        </div>
      </div>
      <div>
        <Button className="bg-blue-1" onClick={save} disabled={loading}>
          Save Settings
        </Button>
      </div>
    </section>
  );
}
