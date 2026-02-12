/* eslint-disable camelcase */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import HomeCard from './HomeCard';
import MeetingModal from './MeetingModal';
import { Call } from '@stream-io/video-react-sdk';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { Textarea } from './ui/textarea';
import dynamic from 'next/dynamic';
import { useToast } from './ui/use-toast';
import { Input } from './ui/input';
import { getGlobalPlanConfig } from '@/actions/billing.actions';

const ReactDatePicker = dynamic(() => import('react-datepicker'), {
  ssr: false,
}) as any;

type Plan = 'free' | 'pro' | 'business';
const planFeatures: Record<Plan, { recordings: boolean; streaming: boolean; groupUnlimited: boolean }> = {
  free: { recordings: false, streaming: false, groupUnlimited: false },
  pro: { recordings: true, streaming: true, groupUnlimited: true },
  business: { recordings: true, streaming: true, groupUnlimited: true },
};

const initialValues = {
  dateTime: new Date(),
  description: '',
  link: '',
};

const MeetingTypeList = ({ onMeetingCreated }: { onMeetingCreated?: () => void }) => {
  const router = useRouter();
  const [meetingState, setMeetingState] = useState<
    'isScheduleMeeting' | 'isJoiningMeeting' | 'isInstantMeeting' | undefined
  >(undefined);
  const [values, setValues] = useState(initialValues);
  const [callDetail, setCallDetail] = useState<Call>();
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  const plan: Plan = (user?.user_metadata?.subscription_plan as Plan) || 'free';
  const active = !!user?.user_metadata?.subscription_active;
  const [config, setConfig] = useState<{ recordingsEnabled: boolean; streamingEnabled: boolean; unlimitedOneOnOne: boolean } | null>(null);
  const [creating, setCreating] = useState(false);
  
  useEffect(() => {
    (async () => {
      try {
        const cfg = await getGlobalPlanConfig();
        setConfig({
          recordingsEnabled: cfg[plan].recordingsEnabled,
          streamingEnabled: cfg[plan].streamingEnabled,
          unlimitedOneOnOne: cfg[plan].unlimitedOneOnOne,
        });
      } catch {
        setConfig({ recordingsEnabled: plan !== 'free', streamingEnabled: plan !== 'free', unlimitedOneOnOne: true });
      }
    })();
  }, [plan]);

  const createMeetingHandler = async (instant?: boolean) => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to create meetings.' });
      return;
    }
    try {
      if (!instant && !values.dateTime) {
        toast({ title: 'Please select a date and time' });
        return;
      }
      setCreating(true);
      const res = await fetch('/api/meetings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: values.description || (instant ? 'Instant Meeting' : 'Scheduled Meeting'),
          startsAt: instant ? new Date() : values.dateTime,
          instant: !!instant,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json?.error || 'Failed to create meeting';
        toast({ title: 'Create failed', description: msg, variant: 'destructive' });
        return;
      }
      setCallDetail({ id: json.id } as unknown as Call);

      if (instant) {
        router.push(`/meeting/${json.id}`);
        return;
      }
      
      if (onMeetingCreated) onMeetingCreated();

      toast({
        title: 'Meeting Created',
      });
    } catch (error) {
      console.error('Failed to create meeting:', error);
      toast({ title: 'Failed to create Meeting', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${callDetail?.id}`;

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:grid-cols-2 xl:grid-cols-4">
      <HomeCard
        img="/icons/add-meeting.svg"
        title="New Meeting"
        description="Start an instant meeting"
        handleClick={() => setMeetingState('isInstantMeeting')}
      />
      <HomeCard
        img="/icons/join-meeting.svg"
        title="Join Meeting"
        description="via invitation link"
        className="bg-blue-1"
        handleClick={() => setMeetingState('isJoiningMeeting')}
      />
      <HomeCard
        img="/icons/schedule.svg"
        title="Schedule Meeting"
        description="Plan your meeting"
        className="bg-purple-1"
        handleClick={() => setMeetingState('isScheduleMeeting')}
      />
      <HomeCard
        img="/icons/recordings.svg"
        title="View Recordings"
        description="Meeting Recordings"
        className="bg-yellow-1"
        handleClick={() => {
          if (!active || !config?.recordingsEnabled) {
            toast({ title: 'Upgrade required', description: 'Recordings are available on Pro and Business plans.' });
            router.push('/pricing');
            return;
          }
          router.push('/recordings');
        }}
      />

      {!callDetail ? (
        <MeetingModal
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={() => setMeetingState(undefined)}
          title="Create Meeting"
          handleClick={() => createMeetingHandler(false)}
        >
          <div className="flex flex-col gap-2.5">
            <label className="text-base font-normal leading-[22.4px] text-sky-2">
              Add a description
            </label>
            <Textarea
              className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
              onChange={(e) =>
                setValues({ ...values, description: e.target.value })
              }
            />
          </div>
          <div className="flex w-full flex-col gap-2.5">
            <label className="text-base font-normal leading-[22.4px] text-sky-2">
              Select Date and Time
            </label>
            <ReactDatePicker
              selected={values.dateTime}
              onChange={(date: Date | null) => setValues({ ...values, dateTime: date! })}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="time"
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full rounded bg-dark-3 p-2 focus:outline-none"
            />
            {plan === 'free' && (
              <p className="text-xs text-gray-400 mt-1">Free plan: group meetings may have limits. Upgrade for unlimited.</p>
            )}
          </div>
        </MeetingModal>
      ) : (
        <MeetingModal
          isOpen={meetingState === 'isScheduleMeeting'}
          onClose={() => setMeetingState(undefined)}
          title="Meeting Created"
          handleClick={() => {
            navigator.clipboard.writeText(meetingLink);
            toast({ title: 'Link Copied' });
          }}
          image={'/icons/checked.svg'}
          buttonIcon="/icons/copy.svg"
          className="text-center"
          buttonText="Copy Meeting Link"
        />
      )}

      <MeetingModal
        isOpen={meetingState === 'isJoiningMeeting'}
        onClose={() => setMeetingState(undefined)}
        title="Type the link here"
        className="text-center"
        buttonText="Join Meeting"
        handleClick={() => router.push(values.link)}
      >
        <Input
          placeholder="Meeting link"
          onChange={(e) => setValues({ ...values, link: e.target.value })}
          className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </MeetingModal>

      <MeetingModal
        isOpen={meetingState === 'isInstantMeeting'}
        onClose={() => setMeetingState(undefined)}
          title="Start an Instant Meeting"
        className="text-center"
        buttonText={creating ? 'Starting…' : 'Start Meeting'}
          handleClick={() => createMeetingHandler(true)}
      />
    </section>
  );
};

export default MeetingTypeList;
