import { useEffect, useState } from 'react';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { Call, useStreamVideoClient } from '@stream-io/video-react-sdk';

export const useGetCalls = () => {
  const { user, isLoaded } = useSupabaseUser();
  const client = useStreamVideoClient();
  const [calls, setCalls] = useState<Call[]>();
  const [isLoading, setIsLoading] = useState(false);

  const loadCalls = async () => {
    if (!client || !user?.id) return;
    
    setIsLoading(true);

    try {
      // https://getstream.io/video/docs/react/guides/querying-calls/#filters
      const { calls } = await client.queryCalls({
        sort: [{ field: 'starts_at', direction: -1 }],
        filter_conditions: {
          starts_at: { $exists: true },
          $or: [
            { created_by_user_id: user.id },
            { members: { $in: [user.id] } },
          ],
        },
      });

      setCalls(calls);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded) {
      loadCalls();
    }
  }, [client, user?.id, isLoaded]);

  const now = new Date();

  const endedCalls = calls?.filter(({ state: { startsAt, endedAt } }: Call) => {
    return (startsAt && new Date(startsAt) < new Date(now.getTime() - 60 * 60 * 1000)) || !!endedAt
  })

  const upcomingCalls = calls?.filter(({ state: { startsAt, endedAt, custom } }: Call) => {
    const meetingStartsAt = startsAt || custom?.starts_at;
    return meetingStartsAt && !endedAt && new Date(meetingStartsAt) > new Date(now.getTime() - 60 * 60 * 1000)
  })
  
  return { endedCalls, upcomingCalls, callRecordings: calls, isLoading: isLoading || !isLoaded, refetch: loadCalls }
};