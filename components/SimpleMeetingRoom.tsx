'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from './ui/button';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';

type Props = { roomId: string };

const SimpleMeetingRoom = ({ roomId }: Props) => {
  const { user } = useSupabaseUser();
  const supabase = useMemo(() => createClient(), []);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const [joined, setJoined] = useState(false);
  const [ending, setEnding] = useState(false);

  const endCall = useCallback(async () => {
    setEnding(true);
    try {
      channelRef.current?.unsubscribe();
      pcRef.current?.getSenders().forEach((s) => {
        const track = s.track;
        if (track && track.kind === 'video') track.stop();
        if (track && track.kind === 'audio') track.stop();
      });
      pcRef.current?.close();
      pcRef.current = null;
      if (localVideoRef.current?.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        localVideoRef.current.srcObject = null;
      }
      if (remoteVideoRef.current?.srcObject) {
        const stream = remoteVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        remoteVideoRef.current.srcObject = null;
      }
    } finally {
      setEnding(false);
      setJoined(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const setup = async () => {
      if (!user?.id) return;
      const local = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(() => null);
      if (!local) return;
      if (!active) return;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = local;
        localVideoRef.current.muted = true;
        await localVideoRef.current.play().catch(() => {});
      }
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
      });
      pcRef.current = pc;
      local.getTracks().forEach((track) => pc.addTrack(track, local));
      pc.ontrack = (ev) => {
        const [stream] = ev.streams;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          remoteVideoRef.current.play().catch(() => {});
        }
      };
      const channel = supabase.channel(`webrtc-${roomId}`, { config: { broadcast: { self: true } } });
      channelRef.current = channel;
      channel.on('broadcast', { event: 'offer' }, async (payload: any) => {
        const offer = payload.payload?.sdp;
        if (!offer || !pcRef.current) return;
        if (!pcRef.current.currentRemoteDescription) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
          const answer = await pcRef.current.createAnswer();
          await pcRef.current.setLocalDescription(answer);
          await channel.send({ type: 'broadcast', event: 'answer', payload: { sdp: answer } });
        }
      });
      channel.on('broadcast', { event: 'answer' }, async (payload: any) => {
        const answer = payload.payload?.sdp;
        if (!answer || !pcRef.current) return;
        if (!pcRef.current.currentRemoteDescription) {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        }
      });
      channel.on('broadcast', { event: 'ice' }, async (payload: any) => {
        const cand = payload.payload?.candidate;
        if (!cand || !pcRef.current) return;
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(cand));
        } catch {}
      });
      pc.onicecandidate = (ev) => {
        if (ev.candidate) {
          channel.send({ type: 'broadcast', event: 'ice', payload: { candidate: ev.candidate } });
        }
      };
      await channel.subscribe();
      const roleSeed = `${user.id}-${roomId}`;
      const isOfferer = roleSeed.localeCompare(`zz-${roomId}`) < 0;
      if (isOfferer) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await channel.send({ type: 'broadcast', event: 'offer', payload: { sdp: offer } });
      }
      setJoined(true);
    };
    setup();
    return () => {
      active = false;
      endCall();
    };
  }, [roomId, supabase, user?.id, endCall]);

  return (
    <section className="flex flex-col items-center justify-center min-h-screen w-full gap-4 p-4 text-white">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
        <video ref={localVideoRef} className="w-full rounded bg-black" playsInline />
        <video ref={remoteVideoRef} className="w-full rounded bg-black" playsInline />
      </div>
      <div className="flex items-center gap-3">
        <Button onClick={endCall} disabled={!joined || ending} className="bg-red-600 hover:bg-red-700">
          End Call
        </Button>
      </div>
    </section>
  );
};

export default SimpleMeetingRoom;
