create extension if not exists pgcrypto;

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text not null,
  price text not null,
  category text not null check (category in ('Free', 'For Sale', 'Wanted')),
  campus text not null,
  image_url text not null,
  image_urls text[],
  seller_email text,
  sold boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.listings enable row level security;

alter table public.listings
add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.listings
add column if not exists seller_email text;

alter table public.listings
add column if not exists image_urls text[];

update public.listings
set image_urls = array[image_url]
where image_urls is null
  and image_url is not null;

alter table public.listings
add column if not exists sold boolean not null default false;

create table if not exists public.saved_listings (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

alter table public.saved_listings enable row level security;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  buyer_last_read_at timestamptz,
  seller_last_read_at timestamptz,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint conversations_buyer_seller_different check (buyer_id <> seller_id),
  constraint conversations_unique_listing_buyer_seller unique (listing_id, buyer_id, seller_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

alter table public.messages
add column if not exists receiver_id uuid references auth.users(id) on delete cascade;

do $$
begin
  if not exists (select 1 from public.messages where receiver_id is null) then
    alter table public.messages alter column receiver_id set not null;
  end if;
end $$;

create index if not exists conversations_buyer_id_idx on public.conversations (buyer_id);
create index if not exists conversations_seller_id_idx on public.conversations (seller_id);
create index if not exists conversations_listing_id_idx on public.conversations (listing_id);
create index if not exists messages_conversation_id_created_at_idx on public.messages (conversation_id, created_at);
create index if not exists messages_receiver_id_idx on public.messages (receiver_id);

drop policy if exists "Listings are viewable by everyone" on public.listings;
create policy "Listings are viewable by everyone"
on public.listings
for select
using (true);

drop policy if exists "Authenticated users can read listings" on public.listings;
create policy "Authenticated users can read listings"
on public.listings
for select
to authenticated
using (true);

drop policy if exists "Anyone can create listings" on public.listings;
drop policy if exists "Authenticated users can create their own listings" on public.listings;
create policy "Authenticated users can create their own listings"
on public.listings
for insert
with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can delete their own listings" on public.listings;
create policy "Authenticated users can delete their own listings"
on public.listings
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Authenticated users can update their own listings" on public.listings;
create policy "Authenticated users can update their own listings"
on public.listings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read their own saved listings" on public.saved_listings;
create policy "Users can read their own saved listings"
on public.saved_listings
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can save listings for themselves" on public.saved_listings;
create policy "Users can save listings for themselves"
on public.saved_listings
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can unsave their own listings" on public.saved_listings;
create policy "Users can unsave their own listings"
on public.saved_listings
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Conversation participants can read conversations" on public.conversations;
create policy "Conversation participants can read conversations"
on public.conversations
for select
to authenticated
using (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists "Buyers can start conversations" on public.conversations;
create policy "Buyers can start conversations"
on public.conversations
for insert
to authenticated
with check (
  auth.uid() = buyer_id
  and buyer_id <> seller_id
  and seller_id = (
    select listings.user_id
    from public.listings
    where listings.id = conversations.listing_id
  )
);

drop policy if exists "Conversation participants can update conversations" on public.conversations;
create policy "Conversation participants can update conversations"
on public.conversations
for update
to authenticated
using (auth.uid() = buyer_id or auth.uid() = seller_id)
with check (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists "Conversation participants can read messages" on public.messages;
create policy "Conversation participants can read messages"
on public.messages
for select
to authenticated
using (
  exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and (conversations.buyer_id = auth.uid() or conversations.seller_id = auth.uid())
  )
);

drop policy if exists "Conversation participants can send messages" on public.messages;
create policy "Conversation participants can send messages"
on public.messages
for insert
to authenticated
with check (
  auth.uid() = sender_id
  and receiver_id <> sender_id
  and exists (
    select 1
    from public.conversations
    where conversations.id = messages.conversation_id
      and (
        (conversations.buyer_id = auth.uid() and conversations.seller_id = messages.receiver_id)
        or (conversations.seller_id = auth.uid() and conversations.buyer_id = messages.receiver_id)
      )
  )
);

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do update
set public = true;

drop policy if exists "Anyone can view listing images" on storage.objects;
create policy "Anyone can view listing images"
on storage.objects
for select
using (bucket_id = 'listing-images');

drop policy if exists "Authenticated users can upload listing images" on storage.objects;
create policy "Authenticated users can upload listing images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listing-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Authenticated users can delete their own listing images" on storage.objects;
create policy "Authenticated users can delete their own listing images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listing-images'
  and auth.uid()::text = (storage.foldername(name))[1]
);

insert into public.listings
  (title, description, price, category, campus, image_url)
values
  (
    'Mini fridge',
    'Compact black mini fridge with a small freezer shelf. Clean, quiet, and ready for pickup before move-out.',
    '$55',
    'For Sale',
    'Fordham',
    '/listings/mini-fridge.svg'
  ),
  (
    'Desk lamp',
    'Adjustable LED desk lamp with three brightness settings. Works well for late study sessions.',
    '$0',
    'Free',
    'NYU',
    '/listings/desk-lamp.svg'
  ),
  (
    'Textbooks',
    'Intro economics and biology textbooks from this semester. Light highlighting, no missing pages.',
    '$30',
    'For Sale',
    'Columbia',
    '/listings/textbooks.svg'
  ),
  (
    'Storage bins',
    'Looking for stackable bins or under-bed storage before move-in weekend. Flexible on pickup.',
    'Any',
    'Wanted',
    'St. John''s',
    '/listings/storage-bins.svg'
  ),
  (
    'Microwave',
    'Dorm-size microwave with simple controls. Fits on a small cart or shared suite counter.',
    '$40',
    'For Sale',
    'Boston College',
    '/listings/microwave.svg'
  ),
  (
    'Dorm chair',
    'Lightweight saucer chair for a dorm corner. A little worn, still comfy and easy to carry.',
    '$0',
    'Free',
    'Other',
    '/listings/dorm-chair.svg'
  );
