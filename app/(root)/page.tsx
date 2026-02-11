'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useSupabaseUser } from '@/hooks/useSupabaseUser';
import Loader from '@/components/Loader';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const LandingPage = () => {
  const { user, isLoaded } = useSupabaseUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) {
      router.replace('/dashboard');
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) return <Loader />;
  if (user) return null;

  return (
    <section className="relative flex size-full flex-col items-center justify-center gap-10 text-black dark:text-white pt-40 pb-24 px-4">
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-500/10" />
      <div className="pointer-events-none absolute top-40 -right-20 h-64 w-64 rounded-full bg-purple-200/40 blur-3xl dark:bg-purple-500/10" />
      <div className="text-center max-w-4xl space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-4 py-2 text-sm text-blue-700 dark:border-blue-900/40 dark:text-blue-200 badge-shine animate-fade-in-up">
          <span className="h-2 w-2 rounded-full bg-blue-600 dark:bg-blue-400 dot-pulse" />
          <span className="font-semibold">New</span>
          <span className="opacity-80">Scheduling and recordings included</span>
        </div>
        <h1 className="text-5xl font-extrabold lg:text-7xl tracking-tight mt-10">
          Effortless video meetings for everyone
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Connect, collaborate, and celebrate from anywhere with TOVO. 
          High-quality video conferencing accessible to everyone.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          {user ? (
            <Link href="/dashboard">
              <Button className="bg-blue-1 text-white px-10 py-6 text-lg rounded-full hover:bg-blue-700 transition-all w-full sm:w-auto">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/sign-up">
                <Button className="bg-blue-1 text-white px-10 py-6 text-lg rounded-full hover:bg-blue-700 transition-all w-full sm:w-auto">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" className="px-10 py-6 text-lg rounded-full border-2 hover:bg-gray-100 dark:hover:bg-dark-3 transition-all w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="ghost" className="px-10 py-6 text-lg rounded-full w-full sm:w-auto">
                  Explore Features
                </Button>
              </Link>
            </>
          )}
          {user && (
            <Link href="/personal-room">
              <Button variant="outline" className="px-10 py-6 text-lg rounded-full border-2 hover:bg-gray-100 dark:hover:bg-dark-3 transition-all w-full sm:w-auto">
                Start Instant Meeting
              </Button>
            </Link>
          )}
        </div>
      </div>
      <SectionTitle
        title="Product Preview"
        subtitle="A quick glimpse of the experience"
      />
      <div className="mt-6 relative w-full max-w-5xl aspect-video rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-1">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400 font-medium">App Preview</p>
        </div>
      </div>
      
      <SectionTitle
        title="Why Teams Choose TOVO"
        subtitle="Fast meetings, reliable recordings, effortless scheduling"
      />
      <div className="mt-10 w-full max-w-6xl px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-gray-200 dark:border-dark-3 bg-white dark:bg-dark-1 p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="relative h-6 w-6">
                <Image src="/icons/add-meeting-light.svg" alt="Instant Meeting" width={24} height={24} className="dark:hidden" />
                <Image src="/icons/add-meeting-dark.svg" alt="Instant Meeting" width={24} height={24} className="hidden dark:block" />
              </span>
              <h3 className="text-lg font-semibold">Instant Meetings</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Jump into a meeting in seconds. No setup required.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-dark-3 bg-white dark:bg-dark-1 p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="relative h-6 w-6">
                <Image src="/icons/schedule-light.svg" alt="Scheduling" width={24} height={24} className="dark:hidden" />
                <Image src="/icons/schedule-dark.svg" alt="Scheduling" width={24} height={24} className="hidden dark:block" />
              </span>
              <h3 className="text-lg font-semibold">Scheduling</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Plan ahead with descriptions and start times that sync.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-dark-3 bg-white dark:bg-dark-1 p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="relative h-6 w-6">
                <Image src="/icons/recordings-light.svg" alt="Recordings" width={24} height={24} className="dark:hidden" />
                <Image src="/icons/recordings-dark.svg" alt="Recordings" width={24} height={24} className="hidden dark:block" />
              </span>
              <h3 className="text-lg font-semibold">Recordings</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Capture your sessions and replay key moments anytime.</p>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-dark-3 bg-white dark:bg-dark-1 p-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="relative h-6 w-6">
                <Image src="/icons/add-personal-light.svg" alt="Personal Room" width={24} height={24} className="dark:hidden" />
                <Image src="/icons/add-personal-dark.svg" alt="Personal Room" width={24} height={24} className="hidden dark:block" />
              </span>
              <h3 className="text-lg font-semibold">Personal Room</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">Your own permanent room for quick syncs and check-ins.</p>
          </div>
        </div>
      </div>
      
      <SectionTitle
        title="What Our Users Say"
        subtitle="Stories from teams building and collaborating"
      />
      
      <AnimatedTestimonials />
      
      <SectionTitle
        title="Trusted by Teams Worldwide"
        subtitle="Reliable infrastructure and delightful user experience"
      />
      <div className="mt-10 w-full max-w-5xl text-center">
        <div className="rounded-2xl border border-gray-200 dark:border-dark-3 bg-white dark:bg-dark-1 p-8">
          <p className="text-sm text-gray-600 dark:text-gray-300">Trusted by teams worldwide</p>
          <div className="mt-3 flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold">99.9%</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">2K</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Meetings hosted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">1 min</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Average setup</div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="mt-20 w-full max-w-5xl text-center text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center justify-center gap-6">
          <Link href="/pricing" className="hover:underline">Pricing</Link>
          <Link href="/profile" className="hover:underline">Profile</Link>
          <Link href="/" className="hover:underline">Home</Link>
        </div>
      </footer>
    </section>
  );
};

export default LandingPage;

const testimonials = [
  {
    quote:
      '“TOVO made our weekly standups effortless. Scheduling, recordings, and quick syncs all in one place.”',
    name: 'Alex Johnson',
    role: 'Product Lead',
    avatar: '/images/avatar-3.png',
  },
  {
    quote:
      '“Crystal clear calls and simple scheduling saved us hours every week. Love the personal rooms.”',
    name: 'Sarah Kim',
    role: 'Engineering Manager',
    avatar: '/images/avatar-2.jpeg',
  },
  {
    quote:
      '“Recordings help our distributed team catch up fast. TOVO keeps our rituals lightweight.”',
    name: 'Diego Rivera',
    role: 'Design Lead',
    avatar: '/images/avatar-4.png',
  },
];

const AnimatedTestimonials = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000);
    return () => clearInterval(id);
  }, []);

  const current = testimonials[index];

  return (
    <div className="mt-16 w-full max-w-4xl px-6">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-dark-3 bg-white dark:bg-dark-1 p-8">
        <div className="pointer-events-none absolute -top-10 -left-10 h-32 w-32 rounded-full bg-blue-100 blur-2xl dark:bg-blue-900/20" />
        <div className="pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-purple-100 blur-2xl dark:bg-purple-900/20" />
        <div className="flex items-start gap-4 transition-opacity duration-700 ease-out">
          <div className="relative h-12 w-12 rounded-full overflow-hidden shrink-0">
            <Image src={current.avatar} alt={current.name} fill className="object-cover" unoptimized />
          </div>
          <div className="space-y-2">
            <p key={index} className="text-lg text-gray-700 dark:text-gray-300 transition-all duration-700">
              {current.quote}
            </p>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold">{current.name}</span> · {current.role}
            </div>
          </div>
        </div>
        <div className="mt-6 flex gap-2">
          {testimonials.map((_, i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full ${
                i === index ? 'bg-blue-600 dark:bg-blue-400' : 'bg-gray-300 dark:bg-dark-3'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  return (
    <div className="flex flex-col items-center text-center animate-fade-in-up">
      <h2 className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-sm md:text-base text-gray-600 dark:text-gray-300">
          {subtitle}
        </p>
      )}
    </div>
  );
};
