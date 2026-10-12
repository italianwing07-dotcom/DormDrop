-- Keep seller_email out of anonymous reads.
--
-- Listings are browsable without an account, and `grant select on
-- public.listings to anon` covered every column, so an anonymous request could
-- read every student's school email straight from the API. Row Level Security
-- does not help here: the rows are meant to be public, it is one column that is
-- not. Column level grants are the right tool.
--
-- Signed-in students keep full access, which is the existing product behaviour
-- behind "Sign in to view seller contact".
--
-- DEPLOY ORDER: apply this together with (or just after) the application
-- release that stops selecting `*` as anon. Applying it under an older release
-- makes anonymous browsing fail, because PostgREST rejects the whole query when
-- it names a column the role cannot read.

revoke select on public.listings from anon;

grant select (
  id,
  user_id,
  title,
  description,
  price,
  category,
  campus,
  image_url,
  image_urls,
  sold,
  created_at
) on public.listings to anon;

-- authenticated keeps every column, including seller_email.
grant select on public.listings to authenticated;
