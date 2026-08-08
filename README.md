# Blurr

Log bottles, tag who was there, and let each person add their own version of the night. No groups — a bottle shows up on someone's shelf as soon as they're a tagged, confirmed participant.

## Stack
Vite + React + Tailwind, backed by Supabase (Postgres + Auth + Storage + Realtime). See `../DESIGN.md` for the full design. UI/animations are ported from the original design bible (`../blurr (1).html`) — see `src/blurr-theme.css`.

## Setup

1. Create a Supabase project.
2. **New project:** in the SQL editor, run `supabase/schema.sql` once — it's the full current schema, start to finish.
   **Existing project:** don't re-run `schema.sql` (it recreates tables from scratch and will error on things that already exist). Instead run whichever files in `supabase/migrations/` you haven't applied yet, in filename order — see "Schema changes" below.
3. In Authentication → Providers, enable Email and (optionally) Google.
4. Branded email templates — Authentication → Email Templates — paste in:
   - `supabase/email-templates/confirm-signup.html` → **Confirm signup**
   - `supabase/email-templates/reset-password.html` → **Reset password**
   - `supabase/email-templates/magic-link.html` → **Magic Link**
   These use Supabase's `{{ .ConfirmationURL }}` / `{{ .Email }}` template variables — don't strip them out.
5. Authentication → URL Configuration: set **Site URL** to wherever you're running the app (e.g. `http://localhost:5173` for local dev, your real domain in production) so confirmation links redirect back to the right place.
6. Copy `.env.example` to `.env` and fill in your project URL + anon key:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
7. `npm install`
8. `npm run dev`

## What's implemented
- Public landing page (`/`) for logged-out visitors — same minimal header bar as the signed-in shelf (sound, settings, "+ add a bottle"), no separate sign-in/sign-up buttons; "+ add a bottle" routes a new visitor to sign up, and a small "already on Blurr? sign in" link covers returning users
- Email/password (username + stricter password requirements, shown live) + Google sign-in; after signup you're told to confirm your email before you can sign in
- Onboarding (username/display name) as a fallback for Google sign-ins that skip the signup form
- Shelf (also `/`, once logged in): bottles you own or are a confirmed tag on (RLS-enforced, no manual filtering), themed shelf background (wooden/floating/crate/fridge/board) even when empty
- Drag-to-rearrange: reorder your own bottles by dragging; order is saved and persists on reload. Bottles you're only tagged on (not owner) aren't draggable
- Real bottle artwork — the actual illustrated skins from the original prototype, not placeholder shapes; uploading a photo swaps it in everywhere, including the picker preview
- Add a bottle: type, name, date, price, photo, tag friends or type a plain name — wrapped in the original "circus" iris transition on save
- Bottle page: photo, snaps gallery + upload, one story per tagged person, tagging, and (owner only) editing the name/date/price/extras after creation
- "Is this you?" claim prompt for unclaimed guest tags, shown anywhere after login
- Friends: search, request/accept/decline, list
- Share link per bottle: public read-only view, claim-and-comment if the visitor signs up and matches a tag
- Realtime: stories/snaps/tags update live for anyone viewing the same bottle
- Full "gamified" chrome from the design bible: bottle-cap intro splash, background music + SFX toggle, settings drawer, a straight-line shelf-style selector (rolling/pickup/place-down SFX on switch and drag), hover/click blips throughout

## Not built yet (see DESIGN.md §10 for suggested order)
- Drag-to-trash with the physical bin + undo toast from the original (bottle deletion is a plain confirm + delete button on the bottle page instead)
- Presence ("X is writing…")

## If you see "new row violates row-level security policy"
This means the `authenticated` role doesn't have the underlying table privilege that the RLS policy also needs. Run `supabase/migrations/schemachanges_2026-08-08_1.sql` (or, for a brand new project, just `schema.sql`, which already includes the fix).

## Schema changes
`schema.sql` is the full schema, kept current — always what a fresh project should run. Every change made *after* a project has already run it gets its own file in `supabase/migrations/`, named `schemachanges_<date>_<n>.sql` where `<n>` resets to 1 each day (`schemachanges_2026-08-08_1.sql`, then `_2.sql` for a second change the same day, etc). Each migration is self-contained and safe to re-run (uses `if not exists`/`or replace` where it can). Apply any you haven't run yet, in filename order, in the Supabase SQL editor.
# blurr
