'use client';

import { ReactNode, useEffect, useState } from 'react';
import { StreamVideoClient, StreamVideo } from '@stream-io/video-react-sdk';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

import { tokenProvider } from '@/actions/stream.actions';
import Loader from '@/components/Loader';

const API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;

const StreamVideoProvider = ({ children }: { children: ReactNode }) => {
  const [videoClient, setVideoClient] = useState<StreamVideoClient>();
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoaded(true);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (!isLoaded || !user) return;
    if (!API_KEY) {
      console.error('Stream API key is missing');
      return;
    }

    console.log('Initializing Stream Client with API Key:', API_KEY);
    console.log('User for Stream Client:', user.id);

    const client = new StreamVideoClient({
      apiKey: API_KEY,
      user: {
        id: user.id,
        name: user.user_metadata?.username || user.email || user.id,
        image: user.user_metadata?.avatar_url,
      },
      tokenProvider,
    });

    setVideoClient(client);
  }, [user, isLoaded]);

  if (user && videoClient) {
    return <StreamVideo client={videoClient}>{children}</StreamVideo>;
  }
  return <>{children}</>;
};

export default StreamVideoProvider;
