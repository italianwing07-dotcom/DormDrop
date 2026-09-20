# DormDrop

DormDrop is a mobile-first student marketplace for giving away, selling, saving, and requesting dorm items by campus. Students can create listings, browse available items, mark their own listings as sold, save listings, and contact sellers by email.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth, Database, Row Level Security, and Storage
- Vercel-ready deployment setup

## Run Locally

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Fill in your Supabase project values in `.env.local`, then start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To verify a production build locally:

```bash
npm run build
```

## Required Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

These are public browser keys from Supabase. Do not commit `.env.local`; it is ignored by `.gitignore`.

## Supabase Setup Notes

Run the SQL in `supabase/schema.sql` from the Supabase SQL editor. It creates:

- `public.listings` for marketplace posts
- `public.saved_listings` for saved items
- Row Level Security policies for reading, creating, updating, deleting, and saving listings
- A public Supabase Storage bucket named `listing-images`
- Storage policies for authenticated image uploads

After running the SQL, make sure email/password authentication is enabled in Supabase Auth. The app expects authenticated users to create listings, save listings, upload images, edit their own listings, delete their own listings, and mark their own listings as sold.

## Vercel Deployment Notes

1. Push this project to a Git provider connected to Vercel.
2. Import the repository in Vercel as a Next.js project.
3. Add these environment variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy with the default Vercel build command:

```bash
npm run build
```

The app uses only public Supabase browser credentials, with access controlled by Supabase Row Level Security.

## Password Recovery

The sign-in form links to `/forgot-password`. Supabase emails a reset link, and
`/reset-password` validates the session before letting the user set a new password.
Expired links lead back to the reset request form. Email requests show the same
confirmation for existing and unknown accounts.

In Supabase **Authentication → URL Configuration**, keep the Site URL set to the
production site and add `https://dorm-drop-xi.vercel.app/reset-password` to Redirect
URLs. For local testing, add `http://localhost:3000/reset-password`. Keep the recovery
email template's `{{ .ConfirmationURL }}` link so Supabase verifies the reset token.
The app also handles `PASSWORD_RECOVERY` on the configured Site URL, in case
Supabase falls back to it. No server or service-role key is needed.

Before release, request a reset for a test account, open the newest email link,
set a matching password of at least 8 characters, sign out, and sign in with the
new password. Also check an expired link, mismatched passwords, and a failed email
request. Build with `npm run build` to verify TypeScript and all routes.

## Launch readiness update

Messaging now uses server timestamps and a database trigger to save each message
and update inbox ordering in the same transaction. Clients reuse message IDs on
retry, reconcile lost responses, and refresh via Supabase Realtime, reconnect,
tab focus, and a 15-second visible-tab fallback. Send failures preserve the thread
and draft. Read markers acknowledge only fetched incoming messages.

Photo creation and editing share preparation: up to five original files, 20 MB
each; HEIC/HEIF conversion is loaded on demand, still images are resized to a
maximum 1600-pixel edge and encoded as JPEG, and GIFs retain animation up to 5 MB.
The storage bucket must enforce a 5 MB upload limit and allow only JPEG, PNG,
WEBP and GIF. HEIC originals are converted before reaching storage.

Admins review reports at `/admin/reports`, also linked from their profile. Removing
a listing hides it from public browsing while retaining its reports and messages.
The owner can see its removed status. An admin can restore it. Ordinary users
cannot read other users' reports or promote themselves to admin.

### Deployment order

1. Apply `supabase/migrations/20260919152913_launch_readiness.sql` to the existing
   Supabase project **before** deploying the app changes. It changes policies,
   grants, triggers, Realtime publication membership, and storage restrictions.
   `supabase/schema.sql` contains the same setup for a new project.
2. Run `supabase/check-launch-readiness.sql`. This uses generated fixture accounts
   inside a transaction and rolls them all back; it sends no emails.
3. Provision the owner's confirmed account as a moderator using the SQL below.
4. Deploy the matching application revision and run the checks in
   [docs/launch-checklist.md](docs/launch-checklist.md).

In the Supabase SQL editor, replace the email below with the explicitly selected
owner account. This is an administrative operation; it is never run from the app.

```sql
do $$
declare chosen_user uuid;
begin
  select id into strict chosen_user from auth.users
  where lower(email) = lower('REPLACE_WITH_CONFIRMED_OWNER_EMAIL')
    and email_confirmed_at is not null;
  insert into public.moderators(user_id) values (chosen_user) on conflict do nothing;
end $$;
```

`npm test` includes isolated Postgres tests of the real application policies,
triggers, and moderation functions, plus component tests for message retries,
updates, unread badges, report actions and photo preparation. The isolated
database models Supabase-owned auth/storage interfaces; live Realtime transport,
storage HTTP enforcement and device photo decoding need the post-deploy checks.
