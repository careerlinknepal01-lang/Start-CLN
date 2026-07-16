# System Architecture

## Overview
CareerLink Nepal is a client-side Single Page Application (SPA) built to connect students, colleges, and industry professionals.

## Tech Stack
- **Frontend Framework**: React 18
- **Build Tool / Bundler**: Vite
- **Routing**: React Router v6 (client-side routing)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + `shadcn/ui` (Radix Primitives)
- **State Management**: React Context (Auth) + TanStack Query (Data Fetching)
- **Backend / Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (GoTrue)
- **Storage**: Supabase Storage buckets (`avatars`, `covers`)

## Key Differences from QA Assumptions
The QA audit assumed a Next.js (SSR/API Routes) architecture. Because this is a Vite SPA, the following patterns apply:
1. **No API Routes**: Database interactions happen directly from the client via the `@supabase/supabase-js` client using Row Level Security (RLS) policies.
2. **No Edge Middleware**: Rate limiting and Edge security checks must be configured at the deployment layer (e.g., Vercel edge configs) or natively within Supabase Auth settings.
3. **No SSR Meta Tags**: OpenGraph and Twitter cards are not dynamically injected by the server. Basic SEO is handled via `react-helmet-async` or direct `document.title` mutations.

## Database & Security (Supabase)
- **PostgreSQL**: Houses core tables (`profiles`, `posts`, `connections`, `messages`, `communities`).
- **Row Level Security (RLS)**: Enforces access control. Example: Users can only update their own `profiles` row; users can only read messages where they are the sender or receiver.
- **Remote Procedure Calls (RPC)**: Complex atomic operations (like `accept_connection_request` or `get_feed_posts`) are handled via PostgreSQL functions to avoid client-side race conditions.
- **Realtime**: WebSockets are used via Supabase Channels for instant messaging and notification delivery.
