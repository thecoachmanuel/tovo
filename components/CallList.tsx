'use client';

import { Call, CallRecording } from '@stream-io/video-react-sdk';

import Loader from './Loader';
import { useGetCalls } from '@/hooks/useGetCalls';
import MeetingCard from './MeetingCard';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

const CallList = ({ type }: { type: 'ended' | 'upcoming' | 'recordings' }) => {
  const router = useRouter();
  const { user } = useSupabaseUser();
  const { endedCalls, upcomingCalls, callRecordings, isLoading, refetch } =
    useGetCalls();
  const [recordings, setRecordings] = useState<CallRecording[]>([]);
  const [serverItems, setServerItems] = useState<any[] | null>(null);

  const getCalls = () => {
    if (serverItems && serverItems.length > 0) return serverItems as any[];
    switch (type) {
      case 'ended':
        return endedCalls;
      case 'recordings':
        return recordings;
      case 'upcoming':
        return upcomingCalls;
      default:
        return [];
    }
  };

  const getNoCallsMessage = () => {
    switch (type) {
      case 'ended':
        return 'No Previous Calls';
      case 'upcoming':
        return 'No Upcoming Calls';
      case 'recordings':
        return 'No Recordings';
      default:
        return '';
    }
  };

  useEffect(() => {
    const fetchServer = async () => {
      try {
        if (type === 'recordings') {
          const res = await fetch('/api/meetings/recordings', { cache: 'no-store' });
          const json = await res.json();
          setServerItems(
            (json as any[]).map((r) => ({
              filename: r.filename,
              url: r.url,
              start_time: r.start_time ? new Date(r.start_time) : undefined,
            })),
          );
        } else if (type === 'upcoming') {
          const res = await fetch('/api/meetings/upcoming', { cache: 'no-store' });
          const json = await res.json();
          setServerItems(
            (json as any[]).map((m) => ({
              id: m.streamCallId,
              state: {
                startsAt: new Date(m.startsAt),
                custom: { starts_at: new Date(m.startsAt), description: m.title },
                createdBy: { id: user?.id },
              },
            })),
          );
        } else if (type === 'ended') {
          const res = await fetch('/api/meetings/ended', { cache: 'no-store' });
          const json = await res.json();
          setServerItems(
            (json as any[]).map((m) => ({
              id: m.streamCallId,
              state: {
                startsAt: new Date(m.startsAt),
                custom: { starts_at: new Date(m.startsAt), description: m.title },
                endedAt: m.endedAt ? new Date(m.endedAt) : undefined,
              },
            })),
          );
        }
      } catch {
        setServerItems([]);
      }
    };
    fetchServer();
  }, [type, callRecordings, user?.id]);

  useEffect(() => {
    const fetchRecordings = async () => {
      const callData = await Promise.all(
        callRecordings?.map((meeting) => meeting.queryRecordings()) ?? [],
      );

      const recs = callData
        .filter((call) => call.recordings.length > 0)
        .flatMap((call) => call.recordings);

      setRecordings(recs);
    };

    if (type === 'recordings' && (!serverItems || serverItems.length === 0)) {
      fetchRecordings();
    }
  }, [type, callRecordings, serverItems]);

  if (isLoading && !serverItems) return <Loader />;

  const calls = getCalls();
  const noCallsMessage = getNoCallsMessage();

  if (!calls || calls.length === 0) return <h1 className="text-2xl font-bold text-black dark:text-white">{noCallsMessage}</h1>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 xl:grid-cols-2">
      {calls.map((meeting: Call | CallRecording) => (
        <MeetingCard
          key={(meeting as Call).id}
          icon={
            type === 'ended'
              ? '/icons/previous.svg'
              : type === 'upcoming'
                ? '/icons/upcoming.svg'
                : '/icons/recordings.svg'
          }
          title={
            (meeting as Call).state?.custom?.description ||
            (meeting as CallRecording).filename?.substring(0, 20) ||
            'No Description'
          }
          date={
            (meeting as Call).state?.startsAt?.toLocaleString() ||
            (meeting as Call).state?.custom?.starts_at?.toLocaleString() ||
            (meeting as CallRecording).start_time?.toLocaleString()
          }
          startsAt={
            (meeting as Call).state?.startsAt 
              ? new Date((meeting as Call).state.startsAt!) 
              : (meeting as Call).state?.custom?.starts_at
                ? new Date((meeting as Call).state.custom.starts_at)
                : undefined
          }
          isPreviousMeeting={type === 'ended'}
          link={
            type === 'recordings'
              ? (meeting as CallRecording).url
              : `${process.env.NEXT_PUBLIC_BASE_URL}/meeting/${(meeting as Call).id}`
          }
          buttonIcon1={type === 'recordings' ? '/icons/play.svg' : undefined}
          buttonText={type === 'recordings' ? 'Play' : 'Start'}
          handleClick={
            type === 'recordings'
              ? () => router.push(`${(meeting as CallRecording).url}`)
              : () => router.push(`/meeting/${(meeting as Call).id}`)
          }
          isHost={type === 'upcoming' && (meeting as Call).state?.createdBy?.id === user?.id}
          callId={type === 'upcoming' ? (meeting as Call).id : undefined}
          onMeetingAction={refetch}
        />
      ))}
    </div>
  );
};

export default CallList;
