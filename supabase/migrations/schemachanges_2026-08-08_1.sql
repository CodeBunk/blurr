-- Blurr schema change 2026-08-08 #1
-- Fix: "new row violates row-level security policy" on insert into bottles
-- (and other tables) — the `authenticated` role had RLS policies but no
-- underlying table privilege to act on. Safe to re-run.

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  profiles, friendships, bottles, bottle_participants, bottle_stories, bottle_snaps, share_links
  to authenticated;
