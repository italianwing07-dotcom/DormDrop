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
