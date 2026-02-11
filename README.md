# TOVO — Video Meetings Platform

TOVO is a Next.js-based video conferencing platform with role-based admin management, subscription billing, trials, and robust analytics.

## Features
- Instant meetings and personal room
- Scheduling with start times and descriptions
- Recordings, previous, and upcoming pages
- Dark/light theme UI with responsive layouts

## Authentication & Access
- Supabase authentication (sign-in/sign-up)
- Server-side route guards via proxy
- Redirects for protected and auth routes

## Video Conferencing
- Powered by Stream Video React SDK
- Grid and speaker layouts
- Participants list, in-call controls, end-call
- In-call chat via Supabase Realtime broadcast
- Hand raise signals
- Time limits and participant caps enforced by plan
- “Go Live” streaming gated to Pro/Business plans

## Admin Panel
- Dashboard with live metrics
- Users management:
  - Filter by email, username, plan, subscription
  - Set plan and active status
  - Start Pro trial per user
  - Charge trial fee via Paystack
- Settings:
  - Global plan configuration (duration, participants, recordings, streaming)
  - Pro trial controls (trial days, fee on/off, fee amount)
- Responsive, mobile-friendly layouts

## Billing & Trials
- Paystack checkout initialization
- Paystack webhook verification
- Subscription activation and metadata tracking
- Admin-configurable Pro trial:
  - Trial period length
  - Optional trial fee (NGN)
  - Admin-triggered trial start and fee charge

## Analytics
- Admin stats API
  - Active users and meetings
  - Monthly recurring revenue (Pro/Business)
  - Total users
  - New users and new subscriptions (7 days)
  - Active trials
  - Average meeting duration (7 days)
  - Meetings per day (7 days)
- Meeting quality collection
  - Network RTT, jitter, and downlink samples
  - Stored server-side for analysis

## Data & Infrastructure
- Prisma models:
  - Meeting (stream call linkage, times, user)
  - MeetingQuality (RTT, jitter, downlink, timestamps)
- Supabase for auth, admin service, and realtime chat broadcast
- Next.js 16 (App Router) with proxy-based guards

## Tech Stack
- Next.js, React, TailwindCSS
- Stream Video React SDK
- Supabase (auth/admin/realtime)
- Prisma (PostgreSQL on Supabase)
- Paystack (payments)

## Development
- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`
- Prisma:
  - Generate: `npx prisma generate`
  - Migrate: `npx prisma migrate dev --name meeting_quality`
