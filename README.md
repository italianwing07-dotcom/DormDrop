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
