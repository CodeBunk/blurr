-- Blurr schema change 2026-08-08 #2
-- The grant fix in #1 didn't clear the RLS error, which points at the
-- policy itself rather than privileges — most likely a leftover/duplicate
-- policy from re-running schema.sql on an already-provisioned project.
-- This drops and recreates the bottles policies cleanly. Safe to re-run.

drop policy if exists "read bottles you own or are tagged on" on bottles;
drop policy if exists "log a bottle as yourself" on bottles;
drop policy if exists "only the owner edits the bottle record" on bottles;
drop policy if exists "only the owner deletes the bottle" on bottles;

alter table bottles enable row level security;

create policy "read bottles you own or are tagged on"
  on bottles for select
  using (public.can_access_bottle(id));

create policy "log a bottle as yourself"
  on bottles for insert
  with check (owner_id = auth.uid());

create policy "only the owner edits the bottle record"
  on bottles for update
  using (owner_id = auth.uid());

create policy "only the owner deletes the bottle"
  on bottles for delete
  using (owner_id = auth.uid());
