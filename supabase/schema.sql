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
add column if not exists sold boolean not null default false;

create table if not exists public.saved_listings (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

alter table public.saved_listings enable row level security;

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
