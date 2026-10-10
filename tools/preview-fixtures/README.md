# Preview fixtures (development only)

These scripts let you open and screenshot every DormLoot screen without a
Supabase project. Nothing here is imported by the application, and nothing here
runs in production.

`mock-supabase.cjs` serves the slice of the Supabase REST, auth and storage APIs
that this app actually calls, backed by in-memory fixture data and generated
placeholder photos. `capture-screens.cjs` drives Playwright over every route at
phone, tablet and desktop widths and reports console errors.

## Use it

```bash
node tools/preview-fixtures/mock-supabase.cjs      # terminal 1, port 54321
```

Point the app at the mock in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key
```

```bash
npm run dev                                        # terminal 2
node tools/preview-fixtures/capture-screens.cjs ./shots   # terminal 3
```

`POST /__reset` restores the fixture data, which the capture script calls before
every screen so runs do not contaminate each other.

## Limits worth knowing

This is a stand-in, not Supabase. It does **not** enforce row level security, so
it proves nothing about permissions; `tests/permission-denials.test.cjs` covers
that against the real schema in Postgres. It also has no Realtime transport, no
email delivery and no true storage enforcement. Those need the post-deploy
checks in `docs/launch-checklist.md`.

The fixture photos are generated gradients, not real item photography. Treat
screenshots taken against them as layout evidence, not as a preview of real
listing imagery.

To render listing images through `next/image` against this mock, add a
development-only `remotePatterns` entry for `localhost:54321`. It is deliberately
not committed so production image rules stay tight.
