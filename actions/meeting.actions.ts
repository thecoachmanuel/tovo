'use server';

import db from '@/lib/db';
import { createClient } from '@/utils/supabase/server';
import { StreamClient } from '@stream-io/node-sdk';
 
const STREAM_API_KEY = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const STREAM_API_SECRET = process.env.STREAM_SECRET_KEY;

export const createMeeting = async ({
  id,
  title,
  startsAt,
  streamCallId,
}: {
  id?: string;
  title: string;
  startsAt: Date;
  streamCallId: string;
}) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    const meeting = await db.meeting.create({
      data: {
        id,
        title,
        startsAt,
        streamCallId,
        createdBy: user.id,
      },
    });

    return meeting;
  } catch (error) {
    console.log(error);
    throw new Error('Failed to create meeting');
  }
};

export const deleteMeeting = async (streamCallId: string) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // Delete from database
    await db.meeting.deleteMany({
      where: {
        streamCallId: streamCallId,
        createdBy: user.id, // Ensure only the creator can delete
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to delete meeting:', error);
    throw new Error('Failed to delete meeting');
  }
};

export const deleteStreamCall = async (streamCallId: string) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }
  if (!STREAM_API_KEY || !STREAM_API_SECRET) {
    throw new Error('Stream credentials missing');
  }

  // Ensure only the meeting creator can delete the Stream call
  const meeting = await db.meeting.findFirst({
    where: { streamCallId },
  });
  if (!meeting || meeting.createdBy !== user.id) {
    throw new Error('Not authorized to delete this meeting');
  }

  const streamClient = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);
  const call = streamClient.video.call('default', streamCallId);
  await call.delete();

  return { success: true };
}

export const updateMeeting = async ({
  streamCallId,
  title,
  startsAt,
}: {
  streamCallId: string;
  title: string;
  startsAt: Date;
}) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // Update in database
    await db.meeting.updateMany({
      where: {
        streamCallId: streamCallId,
        createdBy: user.id, // Ensure only the creator can update
      },
      data: {
        title,
        startsAt,
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to update meeting:', error);
    throw new Error('Failed to update meeting');
  }
};
