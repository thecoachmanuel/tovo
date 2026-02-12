'use client';
import { useState, useEffect } from 'react';
import {
  CallControls,
  CallParticipantsList,
  CallStatsButton,
  CallingState,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
  useCall,
} from '@stream-io/video-react-sdk';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, LayoutList, MessageSquare, Hand } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import Loader from './Loader';
import EndCallButton from './EndCallButton';
import { cn } from '@/lib/utils';
import { createClient } from '@/utils/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from './ui/use-toast';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import { getGlobalPlanConfig } from '@/actions/billing.actions';

type CallLayoutType = 'grid' | 'speaker-left' | 'speaker-right';

const MeetingRoom = () => {
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get('personal');
  const router = useRouter();
  const [layout, setLayout] = useState<CallLayoutType>('speaker-left');
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: string; userId: string; name: string; text: string; ts: number }>>([]);
  const [messageText, setMessageText] = useState('');
  const [unread, setUnread] = useState(0);
  const [raisedHands, setRaisedHands] = useState<Record<string, { name: string; ts: number }>>({});
  const { useCallCallingState } = useCallStateHooks();
  const call = useCall();
  const supabase = createClient();
  const { toast } = useToast();
  const { user } = useSupabaseUser();
  const [durationLimitMs, setDurationLimitMs] = useState<number | null>(null);
  const [isGroup, setIsGroup] = useState(false);
  const [unlimitedOneOnOne, setUnlimitedOneOnOne] = useState(true);
  const [streamingEnabled, setStreamingEnabled] = useState(false);
  const [netPrevRtt, setNetPrevRtt] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (call) {
         call.camera.disable();
         call.microphone.disable();
      }
    };
  }, [call]);

  const callingState = useCallCallingState();

  if (callingState !== CallingState.JOINED) return <Loader />;

  const leaveCall = async () => {
    try {
      await call?.camera?.disable();
      await call?.microphone?.disable();
      await call?.leave();
    } catch (error) {
      console.error('Error leaving call', error);
    }
    router.push(`/`);
  };

  const CallLayout = () => {
    switch (layout) {
      case 'grid':
        return <PaginatedGridLayout />;
      case 'speaker-right':
        return <SpeakerLayout participantsBarPosition="left" />;
      default:
        return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  useEffect(() => {
    if (!call) return;
    const channel = supabase.channel(`call-${call.id}-chat`, { config: { broadcast: { self: true } } });
    channel.on('broadcast', { event: 'message' }, (payload: any) => {
      const msg = payload.payload as { id: string; userId: string; name: string; text: string; ts: number };
      setMessages((prev) => [...prev, msg]);
      if (!showChat) {
        setUnread((c) => c + 1);
        toast({ title: 'New message', description: `${msg.name}: ${msg.text}` });
      }
    });
    channel.on('broadcast', { event: 'hand_raise' }, (payload: any) => {
      const data = payload.payload as { userId: string; name: string; ts: number };
      setRaisedHands((prev) => ({ ...prev, [data.userId]: { name: data.name, ts: data.ts } }));
      toast({ title: 'Hand raised', description: `${data.name} raised their hand` });
    });
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [call, supabase, showChat, toast]);

  const sendMessage = async () => {
    const trimmed = messageText.trim();
    if (!trimmed || !call || !user) return;
    const msg = {
      id: `${user.id}-${Date.now()}`,
      userId: user.id,
      name: user.user_metadata?.username || user.email || 'Guest',
      text: trimmed,
      ts: Date.now(),
    };
    await supabase.channel(`call-${call.id}-chat`, { config: { broadcast: { self: true } } })
      .send({ type: 'broadcast', event: 'message', payload: msg });
    setMessageText('');
  };

  const raiseHand = async () => {
    if (!call || !user) return;
    const payload = {
      userId: user.id,
      name: user.user_metadata?.username || user.email || 'Guest',
      ts: Date.now(),
    };
    await supabase.channel(`call-${call.id}-chat`, { config: { broadcast: { self: true } } })
      .send({ type: 'broadcast', event: 'hand_raise', payload });
  };

  useEffect(() => {
    const setLimit = async () => {
      if (!user) return;
      const cfg = await getGlobalPlanConfig();
      const plan = (user.user_metadata?.subscription_plan as 'free' | 'pro' | 'business') || 'free';
      const active = !!user.user_metadata?.subscription_active;
      const limitMin = cfg[plan].maxDurationMin;
      setUnlimitedOneOnOne(cfg[plan].unlimitedOneOnOne);
      setStreamingEnabled(active && cfg[plan].streamingEnabled);
      setDurationLimitMs(limitMin * 60 * 1000);
    };
    setLimit();
  }, [user]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!call) return;
      const members = call.state.members.length;
      setIsGroup(members > 2);
    }, 3000);
    return () => clearInterval(id);
  }, [call]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        if (!call) return;
        const conn: any = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        const rtt = conn?.rtt as number | undefined;
        const downlink = conn?.downlink as number | undefined; // Mbps
        const jitter = netPrevRtt != null && rtt != null ? Math.abs(rtt - netPrevRtt) : undefined;
        if (rtt != null) setNetPrevRtt(rtt);
        const payload = {
          meetingId: call.id,
          rttMs: rtt,
          downlinkMbps: downlink,
          jitterMs: jitter,
        };
        await fetch('/api/meetings/quality', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch {
        // ignore
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [call, netPrevRtt]);

  useEffect(() => {
    if (!durationLimitMs) return;
    if (!isGroup && unlimitedOneOnOne) return;
    const start = Date.now();
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = durationLimitMs - elapsed;
      if (remaining <= 0) {
        toast({ title: 'Meeting time limit reached' });
        leaveCall();
        clearInterval(id);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [durationLimitMs, isGroup, unlimitedOneOnOne]);

  return (
    <section className="relative min-h-screen w-full overflow-hidden pt-4 pb-20 text-white">
      <div className="relative flex size-full items-center justify-center">
        <div className="flex size-full max-w-[1000px] items-center">
          <CallLayout />
        </div>
        {showParticipants && (
          <div className="md:h-[calc(100vh-86px)] md:ml-2 hidden md:block">
            <CallParticipantsList onClose={() => setShowParticipants(false)} />
          </div>
        )}
        {showChat && (
          <div className="md:h-[calc(100vh-86px)] md:ml-2 md:w-[320px] rounded-2xl bg-[#19232d] p-4 border border-[#2a3440] flex flex-col hidden md:flex">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Chat</p>
              <span className="text-xs text-gray-400">{messages.length} messages</span>
            </div>
            <div className="mt-3 flex-1 overflow-y-auto space-y-3 pr-1">
              {messages.map((m) => (
                <div key={m.id} className="rounded-lg bg-[#1f2a36] p-2">
                  <p className="text-xs text-gray-300">{m.name}</p>
                  <p className="text-sm">{m.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message"
                className="bg-[#1f2a36] border-none text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendMessage();
                }}
              />
              <Button onClick={sendMessage} className="bg-blue-1 hover:bg-blue-1/90">
                Send
              </Button>
            </div>
          </div>
        )}
      </div>
      {/* Mobile overlays */}
      {showParticipants && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setShowParticipants(false)}>
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-[#19232d] p-4 border-t border-[#2a3440] max-h-[60vh] overflow-y-auto">
            <CallParticipantsList onClose={() => setShowParticipants(false)} />
          </div>
        </div>
      )}
      {showChat && (
        <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setShowChat(false)}>
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-[#19232d] p-4 border-t border-[#2a3440] max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Chat</p>
              <span className="text-xs text-gray-400">{messages.length} messages</span>
            </div>
            <div className="mt-3 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className="rounded-lg bg-[#1f2a36] p-2">
                  <p className="text-xs text-gray-300">{m.name}</p>
                  <p className="text-sm">{m.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message"
                className="bg-[#1f2a36] border-none text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') sendMessage();
                }}
              />
              <Button onClick={sendMessage} className="bg-blue-1 hover:bg-blue-1/90">
                Send
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex w-full flex-wrap items-center justify-center gap-3 md:gap-5 px-3 py-2 md:py-3 bg-[#0f1720]/80 backdrop-blur supports-[backdrop-filter]:bg-[#0f1720]/60">
        <CallControls onLeave={leaveCall} />

        <DropdownMenu>
          <div className="flex items-center">
            <DropdownMenuTrigger className="cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]  ">
              <LayoutList size={20} className="text-white" />
            </DropdownMenuTrigger>
          </div>
          <DropdownMenuContent className="border-dark-1 bg-dark-1 text-white">
            {['Grid', 'Speaker-Left', 'Speaker-Right'].map((item, index) => (
              <div key={index}>
                <DropdownMenuItem
                  onClick={() =>
                    setLayout(item.toLowerCase() as CallLayoutType)
                  }
                >
                  {item}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="border-dark-1" />
              </div>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <CallStatsButton />
        <button onClick={() => setShowParticipants((prev) => !prev)}>
          <div className=" cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]  ">
            <Users size={20} className="text-white" />
          </div>
        </button>
        <button
          onClick={() => {
            setShowChat((prev) => !prev);
            if (!showChat) setUnread(0);
          }}
        >
          <div className="relative cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
            <MessageSquare size={20} className="text-white" />
            {unread > 0 && (
              <span className="absolute -top-2 -right-2 h-5 min-w-5 px-1 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                {unread}
              </span>
            )}
          </div>
        </button>
        <button onClick={raiseHand}>
          <div className="relative cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]">
            <Hand size={20} className="text-white" />
          </div>
        </button>
        <button
          onClick={() => {
            if (!streamingEnabled) {
              toast({ title: 'Upgrade required', description: 'Live streaming is available on Pro and Business plans.' });
              return;
            }
            toast({ title: 'Go Live', description: 'Streaming will be available soon.' });
          }}
        >
          <div className=" cursor-pointer rounded-2xl bg-[#19232d] px-4 py-2 hover:bg-[#4c535b]  ">
            <span className="text-white text-sm">Go Live</span>
          </div>
        </button>
        {!isPersonalRoom && <EndCallButton />}
      </div>
      {Object.keys(raisedHands).length > 0 && (
        <div className="absolute top-4 right-4 rounded-2xl bg-[#19232d] px-4 py-3 border border-[#2a3440]">
          <p className="text-sm text-gray-300">Raised hands</p>
          <div className="mt-2 flex flex-col gap-1">
            {Object.entries(raisedHands).map(([uid, info]) => (
              <div key={uid} className="flex items-center gap-2">
                <Hand size={16} className="text-yellow-400" />
                <span className="text-sm">{info.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default MeetingRoom;
