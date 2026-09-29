# Civix — AI-prioritized civic hazard reporting

Photograph a hazard (pothole, broken streetlight, exposed wiring), and Civix
handles the rest: Groq Vision classifies it and rates severity, Groq AI drafts
a formal complaint automatically, and it enters a public map plus an
AI-prioritized triage queue for authorities — ranked by severity, how long
it's been open, and how many citizens confirmed it's still there. Groq AI
also flags likely duplicate reports of the same hazard nearby.

## Why this idea

Most hazard-reporting apps stop at "citizen reports it, it shows on a map."
Civix adds the missing half: a triage queue that helps overwhelmed local
authorities decide what to fix first, plus duplicate detection so the same
pothole doesn't get reported 50 times as 50 separate entries.

## Two account types

- **Citizen**: report hazards, view "my reports," confirm hazards others
  reported are still there, browse the public map.
- **Authority**: everything a citizen can do, plus the AI-prioritized triage
  queue and the ability to update a hazard's status (reported →
  acknowledged → in progress → resolved).

Choose your account type on signup — pick "Authority" to see the triage
dashboard in a demo.

## Tech stack

| Requirement | Implementation |
|---|---|
| Auth | Supabase Auth, with a `profiles` table storing citizen/authority role |
| Protected routes | Next.js middleware redirects unauthenticated users from `/dashboard/*` |
| CRUD | `hazards` table — create (report), read (list/detail/map), update (status, confirmations), delete |
| Analytics dashboard | Recharts — severity breakdown, category breakdown, resolution rate, on the authority dashboard |
| Landing page | `/` — hero, feature grid |
| Public map | `/map` — Leaflet + OpenStreetMap tiles (no API key needed), open to anyone |
| Groq Vision | Classifies hazard photos: category, severity, description |
| Groq AI | Drafts the formal complaint; also powers duplicate-report detection |
| Resend | Status-update emails to reporters; weekly digest of a citizen's open reports |

## Project structure

```
src/
  app/
    page.tsx                          landing page
    (auth)/login, signup              auth pages (signup includes role picker)
    map/                               public hazard map (Leaflet, no auth needed)
    dashboard/
      layout.tsx                      protected shell, role-aware sidebar
      page.tsx                        citizen: "my reports" (redirects authority -> /dashboard/authority)
      authority/                      authority: AI-prioritized triage queue + analytics
      hazards/new/                    report a hazard (photo + geolocation + AI analyze)
      hazards/[id]/                   hazard detail: description, AI complaint draft, confirm button, status controls
    api/
      hazards/route.ts                GET (list) / POST (create)
      hazards/[id]/route.ts           GET / PATCH (status update -> triggers email) / DELETE
      analyze/route.ts                Groq Vision classification + Groq AI complaint draft + duplicate detection
      confirm/route.ts                toggle a "still there" confirmation
      digest/route.ts                 Resend weekly digest
  lib/
    supabase/client.ts, server.ts, middleware.ts
    groq.ts                           Groq Vision + AI helpers (classify, draft complaint, detect duplicates)
    priority.ts                       triage priority scoring + distance calculation
    resend.ts
    types.ts
supabase/schema.sql                   run this first -- profiles, hazards, confirmations tables + RLS + triggers
```

## Setup

### 1. Create a new Supabase project
Run `supabase/schema.sql` in the SQL editor. This creates:
- `profiles` (role: citizen/authority, auto-created on signup via trigger)
- `hazards` (the main table, RLS lets anyone read but only owners/authorities update)
- `confirmations` (community "still there" upvotes, auto-updates `hazards.confirmations_count` via trigger)

In Authentication -> Providers, disable "Confirm email" for easier local testing.

### 2. Environment variables
Copy `.env.example` to `.env.local` and fill in Supabase, Groq, and Resend keys.

### 3. Install and run
```bash
npm install
npm run dev
```

### 4. Try it
- Sign up once as a **citizen**, report a hazard (allow location + camera access)
- Sign up again (different email) as an **authority**, see it appear in the triage queue
- Visit `/map` (no login needed) to see the public map

## Notes

- The Groq model names in `src/lib/groq.ts` may need updating — check
  console.groq.com/docs/models before your final submission.
- Duplicate detection compares hazards within ~300m of each other using both
  AI-judged description similarity and distance — tune `NEARBY_RADIUS_METERS`
  in `src/app/api/analyze/route.ts` if needed.
- The public map uses OpenStreetMap tiles, which need no API key, so it works
  immediately without any extra setup.

## Screenshots

Add screenshots of the landing page, citizen report flow, authority triage
queue, and public map here before submitting.
