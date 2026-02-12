/* eslint-disable camelcase */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import HomeCard from './HomeCard';
import MeetingModal from './MeetingModal';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import Loader from './Loader';
import { Textarea } from './ui/textarea';
import ReactDatePicker from 'react-datepicker';
import { useToast } from './ui/use-toast';
import { Input } from './ui/input';
import { createMeeting } from '@/actions/meeting.actions';
import { getGlobalPlanConfig } from '@/actions/billing.actions';

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
  const client = useStreamVideoClient();
  const { user } = useSupabaseUser();
  const { toast } = useToast();
  const plan: Plan = (user?.user_metadata?.subscription_plan as Plan) || 'free';
  const active = !!user?.user_metadata?.subscription_active;
  const [config, setConfig] = useState<{ recordingsEnabled: boolean; streamingEnabled: boolean; unlimitedOneOnOne: boolean } | null>(null);
  
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

  const createMeetingHandler = async () => {
    if (!client || !user) return;
    try {
      if (!values.dateTime) {
        toast({ title: 'Please select a date and time' });
        return;
      }
      const id = crypto.randomUUID();
      const call = client.call('default', id);
      if (!call) throw new Error('Failed to create meeting');
      
      // Prevent camera from turning on during schedule
      if (meetingState === 'isScheduleMeeting') {
        await call.camera.disable();
        await call.microphone.disable();
      }

      const startsAt =
        values.dateTime.toISOString() || new Date(Date.now()).toISOString();
      const description = values.description || 'Instant Meeting';
      await call.getOrCreate({
        data: {
          starts_at: startsAt,
          custom: {
            description,
            starts_at: startsAt, // Add redundancy
          },
        },
      });

      // Save meeting to database
      await createMeeting({
        title: description,
        startsAt: new Date(startsAt),
        streamCallId: id,
      });

      setCallDetail(call);

      if (meetingState === 'isInstantMeeting') {
        router.push(`/meeting/${call.id}`);
      }
      
      if (onMeetingCreated) onMeetingCreated();

      toast({
        title: 'Meeting Created',
      });
    } catch (error) {
      console.error('Failed to create meeting:', error);
      toast({ title: 'Failed to create Meeting' });
    }
  };

  const ensureClientReady = () => {
    if (!client || !user) {
      toast({ title: 'Please wait', description: 'Initializing meeting services...' });
      return false;
    }
    return true;
  };

  const meetingLink = `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${callDetail?.id}`;

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
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
          handleClick={() => {
            if (!ensureClientReady()) return;
            createMeetingHandler();
          }}
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
              onChange={(date) => setValues({ ...values, dateTime: date! })}
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
        buttonText="Start Meeting"
          handleClick={() => {
            if (!ensureClientReady()) return;
            createMeetingHandler();
          }}
      />
    </section>
  );
};

export default MeetingTypeList;
