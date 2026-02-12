'use client';

import dynamic from 'next/dynamic';
import { useGetCalls } from '@/hooks/useGetCalls';
import { Call } from '@stream-io/video-react-sdk';
import Loader from '@/components/Loader';
import { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

const MeetingTypeListLazy = dynamic(() => import('@/components/MeetingTypeList'), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-gray-200 dark:border-dark-3 bg-white dark:bg-dark-1 p-6">
      <div className="h-6 w-40 bg-gray-200 dark:bg-dark-3 rounded mb-4 animate-pulse" />
      <div className="h-10 w-full bg-gray-200 dark:bg-dark-3 rounded mb-3 animate-pulse" />
      <div className="h-10 w-full bg-gray-200 dark:bg-dark-3 rounded mb-3 animate-pulse" />
      <div className="h-10 w-full bg-gray-200 dark:bg-dark-3 rounded animate-pulse" />
    </div>
  ),
});
const DashboardContent = () => {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const { upcomingCalls, isLoading, refetch } = useGetCalls();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useSupabaseUser();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setDate((new Intl.DateTimeFormat('en-US', { dateStyle: 'full' })).format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ref = searchParams.get('reference');
    if (!ref) return;
    (async () => {
      try {
        const res = await fetch(`/api/paystack/verify?reference=${encodeURIComponent(ref)}`);
        const result = await res.json();
        if (result?.success) {
          toast({ title: 'Subscription Activated', description: `Your ${result.plan} plan is now active.` });
        }
      } catch (e) {
        toast({ title: 'Payment verification failed', variant: 'destructive' });
      }
    })();
  }, [searchParams, toast]);

  const upcomingMeeting = useMemo(() => {
    if (!upcomingCalls || upcomingCalls.length === 0) return null;

    // Sort by startsAt ascending (earliest first)
    return [...upcomingCalls].sort((a: Call, b: Call) => {
      const dateA = new Date(a.state?.startsAt || a.state?.custom?.starts_at || 0);
      const dateB = new Date(b.state?.startsAt || b.state?.custom?.starts_at || 0);
      return dateA.getTime() - dateB.getTime();
    })[0];
  }, [upcomingCalls]);

  if (isLoading) return <Loader />;

  const meetingStartsAt = upcomingMeeting?.state?.startsAt || upcomingMeeting?.state?.custom?.starts_at;
  const meetingTime = meetingStartsAt
    ? new Date(meetingStartsAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : null;

  const meetingLink = upcomingMeeting ? `/meeting/${upcomingMeeting.id}` : '#';

  return (
    <Suspense fallback={<Loader />}>
    <section className="flex size-full flex-col gap-5 text-black dark:text-white">
      <div className="h-[303px] w-full rounded-[20px] bg-hero bg-cover">
        <div className="flex h-full flex-col justify-between max-md:px-5 max-md:py-8 lg:p-11">
          <div className="flex items-center justify-between">
            <div />
            <div className="flex items-center gap-3">
              <span className="rounded-full px-3 py-1 text-xs bg-white/20 dark:bg-dark-3 border border-gray-200 dark:border-dark-3">
                Plan: {user?.user_metadata?.subscription_plan || 'free'}
              </span>
              {user?.user_metadata?.role === 'admin' && (
                <Link href="/admin">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-3 py-1 text-xs">
                    Admin Dashboard
                  </Button>
                </Link>
              )}
              {(!user?.user_metadata?.subscription_active || user?.user_metadata?.subscription_plan === 'free') && (
                <Link href="/pricing">
                  <Button className="bg-blue-1 hover:bg-blue-700 text-white rounded-full px-3 py-1 text-xs">
                    Upgrade
                  </Button>
                </Link>
              )}
            </div>
          </div>
          {upcomingMeeting ? (
             <Link href={meetingLink}>
                <h2 className="glassmorphism max-w-[450px] rounded py-2 text-center text-base font-normal cursor-pointer hover:bg-white/20 transition-all text-black dark:text-white">
                  Upcoming Meeting at: {meetingTime} - {upcomingMeeting.state?.custom?.description?.substring(0, 25) || 'No Title'}
                </h2>
             </Link>
          ) : (
            <h2 className="glassmorphism max-w-[273px] rounded py-2 text-center text-base font-normal text-black dark:text-white">
              No Upcoming Meetings
            </h2>
          )}
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-extrabold lg:text-7xl">{time || '00:00 PM'}</h1>
            <p className="text-lg font-medium text-sky-700 dark:text-sky-1 lg:text-2xl">{date || 'Loading...'}</p>
          </div>
        </div>
      </div>

      <MeetingTypeListLazy onMeetingCreated={refetch} />
    </section>
    </Suspense>
  );
};

export default function Dashboard() {
  return (
    <Suspense fallback={<Loader />}>
      <DashboardContent />
    </Suspense>
  );
}
