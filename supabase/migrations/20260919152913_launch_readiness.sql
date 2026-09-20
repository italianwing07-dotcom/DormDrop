-- Keep message persistence and inbox ordering in one transaction.
revoke update on public.conversations from public, anon, authenticated;
grant update (buyer_last_read_at, seller_last_read_at, last_message_at) on public.conversations to authenticated;

create or replace function public.stamp_message()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.created_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function public.stamp_message() from public, anon, authenticated;
drop trigger if exists stamp_message_before_insert on public.messages;
create trigger stamp_message_before_insert before insert on public.messages
for each row execute function public.stamp_message();

create or replace function public.update_conversation_after_message()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  update public.conversations
  set last_message_at = greatest(last_message_at, new.created_at)
  where id = new.conversation_id;
  if not found then raise exception 'Conversation is not available'; end if;
  return new;
end;
$$;
revoke all on function public.update_conversation_after_message() from public, anon, authenticated;
drop trigger if exists update_conversation_after_message on public.messages;
create trigger update_conversation_after_message after insert on public.messages
for each row execute function public.update_conversation_after_message();

create or replace function public.protect_conversation_read_state()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is not null then
    if auth.uid() <> old.buyer_id and new.buyer_last_read_at is distinct from old.buyer_last_read_at then
      raise exception 'Cannot change another participant''s read state' using errcode = '42501';
    end if;
    if auth.uid() <> old.seller_id and new.seller_last_read_at is distinct from old.seller_last_read_at then
      raise exception 'Cannot change another participant''s read state' using errcode = '42501';
    end if;
  end if;
  new.buyer_last_read_at := greatest(old.buyer_last_read_at, new.buyer_last_read_at);
  new.seller_last_read_at := greatest(old.seller_last_read_at, new.seller_last_read_at);
  new.last_message_at := greatest(old.last_message_at, new.last_message_at);
  return new;
end;
$$;
revoke all on function public.protect_conversation_read_state() from public, anon, authenticated;
drop trigger if exists protect_conversation_read_state on public.conversations;
create trigger protect_conversation_read_state before update on public.conversations
for each row execute function public.protect_conversation_read_state();

alter table public.messages drop constraint if exists messages_content_length;
alter table public.messages add constraint messages_content_length
check (char_length(content) <= 4000) not valid;

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversations') then
    alter publication supabase_realtime add table public.conversations;
  end if;
end;
$$;

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
where id = 'listing-images';

-- Membership is provisioned by the project owner, never by user-editable metadata.
create table if not exists public.moderators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.moderators enable row level security;
revoke all on public.moderators from public, anon, authenticated;
grant select on public.moderators to authenticated;
drop policy if exists "Users can check their own moderator membership" on public.moderators;
create policy "Users can check their own moderator membership" on public.moderators
for select to authenticated using (user_id = (select auth.uid()));

create or replace function public.is_moderator()
returns boolean language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.moderators where user_id = (select auth.uid()));
$$;
revoke all on function public.is_moderator() from public, anon;
grant execute on function public.is_moderator() to authenticated;

-- Only listing IDs and timestamps are public. Reports and reviewer IDs stay private.
-- A separate removal record prevents an owner from undoing moderation by editing a listing.
create table if not exists public.hidden_listings (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  hidden_at timestamptz not null default now()
);
alter table public.hidden_listings enable row level security;
revoke all on public.hidden_listings from public, anon, authenticated;
grant select on public.hidden_listings to anon, authenticated;
grant insert, delete on public.hidden_listings to authenticated;
drop policy if exists "Removal status is public" on public.hidden_listings;
create policy "Removal status is public" on public.hidden_listings for select to anon, authenticated using (true);
drop policy if exists "Moderators can hide listings" on public.hidden_listings;
create policy "Moderators can hide listings" on public.hidden_listings for insert to authenticated
with check ((select public.is_moderator()));
drop policy if exists "Moderators can restore listings" on public.hidden_listings;
create policy "Moderators can restore listings" on public.hidden_listings for delete to authenticated
using ((select public.is_moderator()));

drop policy if exists "Anyone can read listings" on public.listings;
drop policy if exists "Listings are viewable by everyone" on public.listings;
drop policy if exists "Authenticated users can read listings" on public.listings;
drop policy if exists "Available listings are public" on public.listings;
create policy "Available listings are public" on public.listings for select to anon, authenticated
using (not exists (select 1 from public.hidden_listings where listing_id = listings.id));
drop policy if exists "Owners and moderators can read hidden listings" on public.listings;
create policy "Owners and moderators can read hidden listings" on public.listings for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_moderator()));

alter table public.reports add column if not exists reviewed_at timestamptz;
alter table public.reports add column if not exists reviewed_by uuid references auth.users(id) on delete set null;
create index if not exists reports_status_created_at_idx on public.reports(status, created_at desc);
create index if not exists reports_reporter_id_idx on public.reports(reporter_id);
create index if not exists reports_reviewed_by_idx on public.reports(reviewed_by);
drop policy if exists "Users can submit reports" on public.reports;
create policy "Users can submit reports" on public.reports for insert to authenticated
with check (reporter_id = (select auth.uid()) and status = 'open' and reviewed_at is null and reviewed_by is null);
drop policy if exists "Moderators can read reports" on public.reports;
create policy "Moderators can read reports" on public.reports for select to authenticated
using ((select public.is_moderator()));
drop policy if exists "Moderators can review reports" on public.reports;
create policy "Moderators can review reports" on public.reports for update to authenticated
using ((select public.is_moderator())) with check ((select public.is_moderator()));
revoke update on public.reports from public, anon, authenticated;
grant update(status, reviewed_at, reviewed_by) on public.reports to authenticated;

create or replace function public.review_report(report_id uuid, action text)
returns void language plpgsql security invoker set search_path = '' as $$
declare target_listing uuid;
begin
  if auth.uid() is null or not public.is_moderator() then
    raise exception 'Moderator access required' using errcode = '42501';
  end if;
  if action not in ('dismiss', 'remove', 'restore') or action is null then
    raise exception 'Invalid moderation action';
  end if;
  select listing_id into target_listing from public.reports where id = report_id for update;
  if not found then raise exception 'Report not found'; end if;
  if action = 'remove' then
    insert into public.hidden_listings(listing_id) values (target_listing) on conflict do nothing;
    update public.reports set status = 'resolved', reviewed_at = now(), reviewed_by = auth.uid()
    where listing_id = target_listing;
  elsif action = 'restore' then
    delete from public.hidden_listings where listing_id = target_listing;
    update public.reports set status = 'reviewed', reviewed_at = now(), reviewed_by = auth.uid()
    where listing_id = target_listing;
  else
    update public.reports set status = 'reviewed', reviewed_at = now(), reviewed_by = auth.uid()
    where id = report_id;
  end if;
end;
$$;
revoke all on function public.review_report(uuid, text) from public, anon;
grant execute on function public.review_report(uuid, text) to authenticated;
