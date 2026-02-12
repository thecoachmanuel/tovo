'use client';

import { useState, useEffect } from 'react';
import { StreamCall, StreamTheme, useStreamVideoClient } from '@stream-io/video-react-sdk';
import { useParams } from 'next/navigation';
import { Loader } from 'lucide-react';

import { useGetCallById } from '@/hooks/useGetCallById';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import Alert from '@/components/Alert';
import MeetingSetup from '@/components/MeetingSetup';
import MeetingRoom from '@/components/MeetingRoom';
import { getGlobalPlanConfig } from '@/actions/billing.actions';
import StreamVideoProvider from '@/providers/StreamClientProvider';
import SimpleMeetingRoom from '@/components/SimpleMeetingRoom';

const MeetingPage = () => {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const { isLoaded, user } = useSupabaseUser();
  const { call, isCallLoading } = useGetCallById(id);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [configLoaded, setConfigLoaded] = useState(false);
  const streamClient = useStreamVideoClient();
  
  useEffect(() => {
    const checkLimits = async () => {
      if (!call || !user) {
        setConfigLoaded(true);
        return;
      }
      const cfg = await getGlobalPlanConfig();
      const plan = (user.user_metadata?.subscription_plan as 'free' | 'pro' | 'business') || 'free';
      const active = !!user.user_metadata?.subscription_active;
      const maxParticipants = cfg[plan].maxParticipants;
      const currentMembers = call.state.members.length;
      const unlimitedOneOnOne = cfg[plan].unlimitedOneOnOne;
      const isGroup = currentMembers > 2;
      if (isGroup && ((!active || plan === 'free') || !unlimitedOneOnOne) && currentMembers >= maxParticipants) {
        setLimitError('Participant limit reached for your plan');
      }
      setConfigLoaded(true);
    };
    checkLimits();
  }, [call, user]);

  if (!isLoaded || isCallLoading || !configLoaded) return <Loader />;

  if (!streamClient) return <SimpleMeetingRoom roomId={id} />;
  if (!call) return <Alert title="Call Not Found" />;

  // get more info about custom call type:  https://getstream.io/video/docs/react/guides/configuring-call-types/
  const notAllowed = call.type === 'invited' && (!user || !call.state.members.find((m) => m.user.id === user.id));

  if (notAllowed) return <Alert title="You are not allowed to join this meeting" />;
  if (limitError) return <Alert title={limitError} />;

  return (
    <StreamVideoProvider>
      <main className="h-screen w-full">
        <StreamCall call={call}>
          <StreamTheme>

          {!isSetupComplete ? (
            <MeetingSetup setIsSetupComplete={setIsSetupComplete} />
          ) : (
            <MeetingRoom />
          )}
          </StreamTheme>
        </StreamCall>
      </main>
    </StreamVideoProvider>
  );
};

export default MeetingPage;
