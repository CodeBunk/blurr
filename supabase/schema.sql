-- Blurr schema — run in the Supabase SQL editor.
-- No "circles"/groups: a bottle belongs to whoever logged it, and shows up
-- on a tagged person's shelf once they confirm they are that tag.

create extension if not exists pgcrypto;

-- ───────────────────────── profiles ─────────────────────────
create table profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  username     text unique not null,
  display_name text not null,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "profiles are readable by any signed-in user"
  on profiles for select
  using (auth.role() = 'authenticated');

create policy "users manage their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "users insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- auto-create a profile row on signup. Username/display name are collected
-- in the signup form and passed through as user metadata; if that's missing
-- (e.g. Google sign-in) or the desired username is already taken, falls
-- back to a generated one rather than failing the whole signup.
create function public.handle_new_user()
returns trigger as $$
declare
  desired_username text := coalesce(nullif(trim(new.raw_user_meta_data->>'username'), ''), 'user_' || substr(new.id::text, 1, 8));
  fallback_username text := 'user_' || substr(new.id::text, 1, 8);
  desired_name text := coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'New user');
begin
  begin
    insert into public.profiles (id, username, display_name)
    values (new.id, lower(desired_username), desired_name);
  exception when unique_violation then
    insert into public.profiles (id, username, display_name)
    values (new.id, fallback_username, desired_name);
  end;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Lets the signup form check availability before creating the account.
-- Security definer so it works for the signed-out (anon) role too, and
-- only ever returns a boolean — never leaks who owns the name.
create function public.is_username_taken(check_username text)
returns boolean as $$
  select exists (select 1 from profiles where lower(username) = lower(check_username));
$$ language sql security definer stable;

-- ───────────────────────── friendships ─────────────────────────
create type friendship_status as enum ('pending', 'accepted', 'blocked');

create table friendships (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid not null references profiles(id) on delete cascade,
  addressee_id  uuid not null references profiles(id) on delete cascade,
  status        friendship_status not null default 'pending',
  created_at    timestamptz not null default now(),
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

alter table friendships enable row level security;

create policy "see your own friendships"
  on friendships for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "send a friend request"
  on friendships for insert
  with check (auth.uid() = requester_id);

create policy "respond to a friend request"
  on friendships for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "remove a friendship"
  on friendships for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- ───────────────────────── bottles ─────────────────────────
create table bottles (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references profiles(id) on delete cascade,
  skin        text not null,
  label       text not null,
  ml          int default 0,
  date        date,
  cost        numeric default 0,
  currency    text default '₹',
  extras      jsonb not null default '[]',
  photo_url   text,
  rack        int default 0,
  position    int default 0,
  created_at  timestamptz not null default now()
);

create table bottle_participants (
  id           uuid primary key default gen_random_uuid(),
  bottle_id    uuid not null references bottles(id) on delete cascade,
  user_id      uuid references profiles(id) on delete set null,
  guest_name   text,
  added_by     uuid not null references profiles(id) on delete cascade,
  claimed_at   timestamptz,
  created_at   timestamptz not null default now(),
  check (user_id is not null or guest_name is not null)
);

create table bottle_stories (
  id             uuid primary key default gen_random_uuid(),
  bottle_id      uuid not null references bottles(id) on delete cascade,
  participant_id uuid not null references bottle_participants(id) on delete cascade,
  body           text not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (bottle_id, participant_id)
);

create table bottle_snaps (
  id            uuid primary key default gen_random_uuid(),
  bottle_id     uuid not null references bottles(id) on delete cascade,
  uploaded_by   uuid not null references profiles(id) on delete cascade,
  storage_path  text not null,
  caption       text,
  created_at    timestamptz not null default now()
);

create table share_links (
  id           uuid primary key default gen_random_uuid(),
  bottle_id    uuid not null references bottles(id) on delete cascade,
  token        text unique not null default replace(replace(encode(gen_random_bytes(9), 'base64'), '+', '-'), '/', '_'),
  created_by   uuid not null references profiles(id) on delete cascade,
  expires_at   timestamptz,
  can_comment  boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ───────────────────────── helper: can I see this bottle? ─────────────────────────
create function public.can_access_bottle(bottle uuid)
returns boolean as $$
  select exists (
    select 1 from bottles b
    where b.id = bottle
      and (
        b.owner_id = auth.uid()
        or exists (
          select 1 from bottle_participants p
          where p.bottle_id = b.id and p.user_id = auth.uid()
        )
      )
  );
$$ language sql security definer stable;

-- ───────────────────────── RLS: bottles ─────────────────────────
alter table bottles enable row level security;

-- Plain owner_id = auth.uid() fast path first: PostgREST does
-- INSERT ... RETURNING for every insert, and Postgres enforces this SELECT
-- policy against the row it's about to return. can_access_bottle() alone
-- re-queries `bottles`, and evaluated from inside the very same INSERT
-- command that created the row, that self-referential subquery doesn't
-- reliably see the not-yet-command-counted new row — causing every insert
-- to be rejected with "new row violates row-level security policy" even
-- though ownership was correct. The plain column comparison has no such
-- staleness.
create policy "read bottles you own or are tagged on"
  on bottles for select
  using (owner_id = auth.uid() or public.can_access_bottle(id));

create policy "log a bottle as yourself"
  on bottles for insert
  with check (owner_id = auth.uid());

create policy "only the owner edits the bottle record"
  on bottles for update
  using (owner_id = auth.uid());

create policy "only the owner deletes the bottle"
  on bottles for delete
  using (owner_id = auth.uid());

-- ───────────────────────── RLS: bottle_participants ─────────────────────────
alter table bottle_participants enable row level security;

create policy "read participants of a bottle you can see"
  on bottle_participants for select
  using (public.can_access_bottle(bottle_id));

create policy "owner tags people"
  on bottle_participants for insert
  with check (
    added_by = auth.uid()
    and exists (select 1 from bottles b where b.id = bottle_id and b.owner_id = auth.uid())
  );

create policy "claim your own guest tag"
  on bottle_participants for update
  using (public.can_access_bottle(bottle_id))
  with check (user_id = auth.uid());

-- ───────────────────────── RLS: bottle_stories ─────────────────────────
alter table bottle_stories enable row level security;

create policy "read stories on a bottle you can see"
  on bottle_stories for select
  using (public.can_access_bottle(bottle_id));

create policy "write only your own story"
  on bottle_stories for insert
  with check (
    exists (
      select 1 from bottle_participants p
      where p.id = participant_id and p.user_id = auth.uid()
    )
  );

create policy "edit only your own story"
  on bottle_stories for update
  using (
    exists (
      select 1 from bottle_participants p
      where p.id = participant_id and p.user_id = auth.uid()
    )
  );

-- ───────────────────────── RLS: bottle_snaps ─────────────────────────
alter table bottle_snaps enable row level security;

create policy "read snaps on a bottle you can see"
  on bottle_snaps for select
  using (public.can_access_bottle(bottle_id));

create policy "add snaps to a bottle you can see"
  on bottle_snaps for insert
  with check (public.can_access_bottle(bottle_id) and uploaded_by = auth.uid());

-- ───────────────────────── RLS: share_links ─────────────────────────
alter table share_links enable row level security;

create policy "owner manages share links"
  on share_links for all
  using (exists (select 1 from bottles b where b.id = bottle_id and b.owner_id = auth.uid()));

-- Public read of a single bottle by token, without exposing the table via RLS.
create function public.get_shared_bottle(share_token text)
returns table (
  id uuid, label text, skin text, ml int, date date, cost numeric,
  currency text, extras jsonb, photo_url text, can_comment boolean
) as $$
  select b.id, b.label, b.skin, b.ml, b.date, b.cost, b.currency, b.extras, b.photo_url, s.can_comment
  from share_links s
  join bottles b on b.id = s.bottle_id
  where s.token = share_token
    and (s.expires_at is null or s.expires_at > now());
$$ language sql security definer stable;

-- ───────────────────────── storage buckets ─────────────────────────
insert into storage.buckets (id, name, public) values ('bottle-photos', 'bottle-photos', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('bottle-snaps', 'bottle-snaps', true)
  on conflict (id) do nothing;

create policy "authenticated users upload bottle photos"
  on storage.objects for insert
  with check (bucket_id = 'bottle-photos' and auth.role() = 'authenticated');

create policy "anyone reads bottle photos"
  on storage.objects for select
  using (bucket_id = 'bottle-photos');

create policy "authenticated users upload snaps"
  on storage.objects for insert
  with check (bucket_id = 'bottle-snaps' and auth.role() = 'authenticated');

create policy "anyone reads bottle snaps"
  on storage.objects for select
  using (bucket_id = 'bottle-snaps');

-- ───────────────────────── claiming guest tags ─────────────────────────
-- Unclaimed guest_name participants aren't visible via normal RLS (you don't
-- have access to a bottle until you're a confirmed participant on it) — so
-- claiming needs its own narrow, security-definer entry points.

-- Returns candidate guest tags across ALL bottles whose typed name loosely
-- matches the caller's own name. Only exposes what's needed to show a
-- "is this you?" prompt — not the rest of the bottle.
create function public.list_claimable_tags()
returns table (
  participant_id uuid,
  bottle_id uuid,
  bottle_label text,
  bottle_date date,
  guest_name text
) as $$
  select p.id, b.id, b.label, b.date, p.guest_name
  from bottle_participants p
  join bottles b on b.id = p.bottle_id
  join profiles me on me.id = auth.uid()
  where p.user_id is null
    and p.guest_name is not null
    and (
      lower(p.guest_name) = lower(me.display_name)
      or lower(p.guest_name) = lower(me.username)
      or lower(p.guest_name) like '%' || lower(me.display_name) || '%'
      or lower(me.display_name) like '%' || lower(p.guest_name) || '%'
    );
$$ language sql security definer stable;

-- Claims a guest tag as the calling user. Re-checks the name loosely
-- matches so this can't be used to grab an arbitrary tag.
create function public.claim_tag(target_participant_id uuid)
returns void as $$
declare
  g text;
  me record;
begin
  select display_name, username into me from profiles where id = auth.uid();
  select guest_name into g from bottle_participants where id = target_participant_id and user_id is null;

  if g is null then
    raise exception 'nothing to claim';
  end if;

  if lower(g) <> lower(me.display_name)
     and lower(g) <> lower(me.username)
     and lower(g) not like '%' || lower(me.display_name) || '%'
     and lower(me.display_name) not like '%' || lower(g) || '%' then
    raise exception 'name does not match';
  end if;

  update bottle_participants
  set user_id = auth.uid(), claimed_at = now()
  where id = target_participant_id and user_id is null;
end;
$$ language plpgsql security definer;

-- ───────────────────────── realtime ─────────────────────────
alter publication supabase_realtime add table bottle_stories;
alter publication supabase_realtime add table bottle_snaps;
alter publication supabase_realtime add table bottle_participants;

-- ───────────────────────── function grants ─────────────────────────
-- Supabase grants EXECUTE on new functions to anon/authenticated by default,
-- but make it explicit so signed-out visitors can check username
-- availability and view a shared bottle.
grant execute on function public.is_username_taken(text) to anon, authenticated;
grant execute on function public.get_shared_bottle(text) to anon, authenticated;
grant execute on function public.list_claimable_tags() to authenticated;
grant execute on function public.claim_tag(uuid) to authenticated;

-- ───────────────────────── table grants ─────────────────────────
-- RLS policies only take effect once the role has the underlying SQL
-- privilege — Supabase's dashboard-created tables get this automatically,
-- but tables created by hand in the SQL editor sometimes don't inherit it,
-- which shows up as "new row violates row-level security policy" even
-- though the policy itself is correct. Make it explicit.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  profiles, friendships, bottles, bottle_participants, bottle_stories, bottle_snaps, share_links
  to authenticated;
