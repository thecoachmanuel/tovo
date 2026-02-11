'use client';
import { useEffect, useState, useRef } from 'react';
import {
  DeviceSettings,
  VideoPreview,
  useCall,
  useCallStateHooks,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

import Alert from './Alert';
import { Button } from './ui/button';

const MeetingSetup = ({
  setIsSetupComplete,
}: {
  setIsSetupComplete: (value: boolean) => void;
}) => {
  // https://getstream.io/video/docs/react/guides/call-and-participant-state/#call-state
  const { useCallEndedAt, useCallStartsAt, useParticipantCount } = useCallStateHooks();
  const callStartsAt = useCallStartsAt();
  const callEndedAt = useCallEndedAt();
  const participantCount = useParticipantCount();
  const call = useCall();
  const client = useStreamVideoClient();
  const { user: supaUser } = useSupabaseUser();
  const [isSetup, setIsSetup] = useState(false);

  if (!call || !client) {
    throw new Error(
      'useStreamCall must be used within a StreamCall component.',
    );
  }

  const callTimeNotArrived =
    callStartsAt && new Date(callStartsAt) > new Date();
  const callHasEnded = !!callEndedAt;

  // https://getstream.io/video/docs/react/ui-cookbook/replacing-call-controls/
  const [isMicCamToggled, setIsMicCamToggled] = useState(true);
  const [hasMediaAccess, setHasMediaAccess] = useState<boolean | null>(null);
  const isJoining = useRef(false);

  useEffect(() => {
    // Check call state to determine if meeting has started (host joined)
    const checkCallStatus = async () => {
       // Query call to get latest state
       await call.get();
    };
    checkCallStatus();
  }, [call]);

  const isHost = !!(call.state.createdBy && supaUser?.id === call.state.createdBy.id);

  // Logic:
  // If callTimeNotArrived:
  //   If isHost -> Allow
  //   If !isHost -> Check if host is present? 
  //     If call.state.participantCount > 0 ? (assuming host is the first)
  //     Or if call has started (session active)?
  
  // We can force allow if isHost.

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (navigator.mediaDevices) {
        setHasMediaAccess(true);
      } else {
        setHasMediaAccess(false);
        console.error("navigator.mediaDevices is undefined. Secure Context (HTTPS) required.");
      }
    }
  }, []);

  useEffect(() => {
    if (hasMediaAccess === false) return;

    const updateDevices = async () => {
      try {
        if (isMicCamToggled) {
          await call?.camera?.disable();
          await call?.microphone?.disable();
        } else {
          await call?.camera?.enable();
          await call?.microphone?.enable();
        }
      } catch (error) {
        console.error('Error toggling devices:', error);
      }
    };

    updateDevices();
  }, [isMicCamToggled, call?.camera, call?.microphone, hasMediaAccess]);

  useEffect(() => {
    return () => {
      if (isJoining.current) return;
      
      const cleanup = async () => {
        try {
          await call?.camera?.disable();
          await call?.microphone?.disable();
        } catch (error) {
          console.error('Error cleaning up devices:', error);
        }
      };
      cleanup();
    };
  }, [call?.camera, call?.microphone]);

  if (callTimeNotArrived) {
    if (!isHost) {
      // If not host, check if meeting has started (host joined)
      // We can check participant count. If > 0, host is likely there or someone else.
      // But strictly, we should wait for host.
      // Stream doesn't strictly enforce "host must be there" for guests unless configured.
      // But the requirement is "wait for host to join".
      
      // We can assume if participantCount > 0, the meeting is active?
      // Or explicitly check if host is in participants.
      // Since we haven't joined, we can't see participants easily without querying.
      // call.state.participants contains current participants.
      
      // Let's rely on call.state.startedAt? No, that's scheduled start.
      // Let's use participant count as a proxy for "started".
      
      const hasStarted = participantCount > 0;
      
      if (!hasStarted) {
         return (
           <Alert
             title={`Waiting for host to join. Scheduled for ${new Date(callStartsAt).toLocaleString()}`}
           />
         );
      }
    }
    // If isHost, fall through to render setup (allow join)
  }

  if (callHasEnded)
    return (
      <Alert
        title="The call has been ended by the host"
        iconUrl="/icons/call-ended.svg"
      />
    );

  if (hasMediaAccess === false) {
     return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-3 text-white px-4">
           <h1 className="text-center text-2xl font-bold text-red-500">Device Access Error</h1>
           <p className="text-center text-lg">
             Camera and Microphone access is blocked by your browser.
           </p>
           <p className="text-center text-sm text-gray-400">
             If you are testing on mobile via a local network (IP address), browsers block media access for security reasons (HTTP).
             Please try using <b>HTTPS</b> or run on <b>localhost</b>.
           </p>
        </div>
     );
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-3 text-white">
      <h1 className="text-center text-2xl font-bold">Setup</h1>
      <VideoPreview />
      <div className="flex h-16 items-center justify-center gap-3">
        <label className="flex items-center justify-center gap-2 font-medium">
          <input
            type="checkbox"
            checked={isMicCamToggled}
            onChange={(e) => setIsMicCamToggled(e.target.checked)}
          />
          Join with mic and camera off
        </label>
        <DeviceSettings />
      </div>
      <Button
        className="rounded-md bg-green-500 px-4 py-2.5"
        onClick={() => {
          isJoining.current = true;
          call.join();

          setIsSetupComplete(true);
        }}
      >
        Join meeting
      </Button>
    </div>
  );
};

export default MeetingSetup;
