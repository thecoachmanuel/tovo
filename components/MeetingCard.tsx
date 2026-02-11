"use client";

import Image from "next/image";

import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { avatarImages } from "@/constants";
import { useToast } from "./ui/use-toast";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { deleteMeeting, updateMeeting, deleteStreamCall } from "@/actions/meeting.actions";
import { Edit, Trash } from "lucide-react";
import { useState } from "react";
import MeetingModal from "./MeetingModal";
import { Input } from "./ui/input";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface MeetingCardProps {
  title: string;
  date: string;
  icon: string;
  isPreviousMeeting?: boolean;
  buttonIcon1?: string;
  buttonText?: string;
  handleClick: () => void;
  link: string;
  isHost?: boolean;
  callId?: string;
  onMeetingAction?: () => void;
  startsAt?: Date;
}

const MeetingCard = ({
  icon,
  title,
  date,
  isPreviousMeeting,
  buttonIcon1,
  handleClick,
  link,
  buttonText,
  isHost,
  callId,
  onMeetingAction,
  startsAt,
}: MeetingCardProps) => {
  const { toast } = useToast();
  const client = useStreamVideoClient();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editValues, setEditValues] = useState({
    title: title,
    dateTime: startsAt || new Date(),
  });

  const handleDelete = async () => {
    if (!client || !callId) return;
    
    const confirmDelete = window.confirm("Are you sure you want to delete this meeting?");
    if (!confirmDelete) return;

    try {
      await deleteStreamCall(callId);
      await deleteMeeting(callId);
      
      toast({ title: "Meeting Deleted" });
      if (onMeetingAction) onMeetingAction();
    } catch (error) {
      console.error(error);
      toast({ title: "Failed to delete meeting", variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!client || !callId) return;

    try {
      const call = client.call("default", callId);
      
      const startsAt = editValues.dateTime.toISOString();
      
      await call.update({
        starts_at: startsAt,
        custom: {
          description: editValues.title,
        },
      });

      await updateMeeting({
        streamCallId: callId,
        title: editValues.title,
        startsAt: editValues.dateTime,
      });

      toast({ title: "Meeting Updated" });
      setIsEditOpen(false);
      if (onMeetingAction) onMeetingAction();
    } catch (error) {
      console.error(error);
      toast({ title: "Failed to update meeting", variant: "destructive" });
    }
  };

  return (
    <section className="relative flex min-h-[258px] w-full flex-col justify-between rounded-[14px] bg-white dark:bg-dark-1 border border-gray-200 dark:border-transparent px-5 py-8 xl:max-w-[568px]">
      <article className="flex flex-col gap-5">
        <Image src={icon} alt="upcoming" width={28} height={28} />
        <div className="flex justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-base font-normal">{date}</p>
          </div>
        </div>
      </article>
      <div className="absolute top-3 right-3 flex gap-2 z-10">
         {isHost && !isPreviousMeeting && (
           <>
             <Button onClick={() => setIsEditOpen(true)} size="icon" variant="ghost" className="bg-dark-3 hover:bg-dark-4 text-white rounded-lg">
               <Edit width={16} height={16} />
             </Button>
             <Button onClick={handleDelete} size="icon" variant="ghost" className="bg-red-500 hover:bg-red-600 text-white rounded-lg">
               <Trash width={16} height={16} />
             </Button>
           </>
         )}
      </div>
      <article className="flex justify-center relative">
        {/* Edit Meeting Modal */}
        <MeetingModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title="Edit Meeting"
          handleClick={handleUpdate}
          buttonText="Update Meeting"
        >
           <div className="flex flex-col gap-2.5">
            <label className="text-base font-normal leading-[22px] text-sky-2">
              Add a description
            </label>
            <Input
              className="border-none bg-dark-3 focus-visible:ring-0 focus-visible:ring-offset-0 text-black dark:text-white"
              onChange={(e) =>
                setEditValues({ ...editValues, title: e.target.value })
              }
              value={editValues.title}
            />
          </div>
          <div className="flex w-full flex-col gap-2.5">
            <label className="text-base font-normal leading-[22px] text-sky-2">
              Select Date and Time
            </label>
            <ReactDatePicker
              selected={editValues.dateTime}
              onChange={(date) => setEditValues({ ...editValues, dateTime: date! })}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="time"
              dateFormat="MMMM d, yyyy h:mm aa"
              className="w-full rounded bg-dark-3 p-2 focus:outline-none text-black dark:text-white"
            />
          </div>
        </MeetingModal>


        {isPreviousMeeting && !isHost && (
          <div className="flex gap-2">
            <Button onClick={handleClick} className="rounded bg-blue-1 px-6">
              {buttonIcon1 && (
                <Image src={buttonIcon1} alt="feature" width={20} height={20} />
              )}
              &nbsp; {buttonText}
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(link);
                toast({
                  title: "Link Copied",
                });
              }}
              className="bg-dark-4 px-6"
            >
              <Image
                src="/icons/copy.svg"
                alt="feature"
                width={20}
                height={20}
              />
              &nbsp; Copy Link
            </Button>
          </div>
        )}
        
        {!isPreviousMeeting && (
          <div className="flex w-full gap-2">
             <Button onClick={handleClick} className="rounded bg-blue-1 px-6 flex-1">
              {buttonIcon1 && (
                <Image src={buttonIcon1} alt="feature" width={20} height={20} />
              )}
              &nbsp; {buttonText}
            </Button>
            <Button
              onClick={() => {
                navigator.clipboard.writeText(link);
                toast({
                  title: "Link Copied",
                });
              }}
              className="bg-dark-4 px-6"
            >
              <Image
                src="/icons/copy.svg"
                alt="feature"
                width={20}
                height={20}
              />
              &nbsp; Copy Link
            </Button>
          </div>
        )}
      </article>
    </section>
  );
};

export default MeetingCard;
