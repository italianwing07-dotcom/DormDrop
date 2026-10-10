# DormLoot launch checks

## Verified automatically

Run all three before any deploy. All are currently green.

```bash
npm run lint     # 0 warnings
npm run build    # compiles, 18 routes
npm test         # 28 tests
```

What the tests actually prove:

- **Isolated Postgres, real policies.** `tests/database-launch.test.cjs` and
  `tests/permission-denials.test.cjs` load the real `supabase/schema.sql` plus
  the launch migration into pglite and exercise them. Covered: listing
  create/edit/sold/delete, saved listings, buyer and seller replies, unread
  markers, message timestamps, duplicate message IDs, conversation privacy,
  report privacy, moderator access, removal and restore, and a third unrelated
  account failing to read or modify other students' listings, conversations,
  reports, read state and photo objects.
- **Component behaviour.** Lost send responses, failed replies preserving the
  draft, incoming updates, unread badges, logout clearing private content,
  moderator confirmation, photo validation, HEIC conversion wiring, resizing,
  and the password-recovery form flow.

## Verified by eye, against fixture data

Every route was rendered at 390, 768 and 1440 px with no console errors, using
`tools/preview-fixtures`. That checks layout, states and copy. It does **not**
check Supabase behaviour, because the fixtures are a stand-in.

## Still open, needs project access

These cannot be closed from the repository.

1. **Apply the database update first.** Run
   `supabase/migrations/20260919152913_launch_readiness.sql` against the live
   project **before** deploying the matching app revision. It changes policies,
   grants, triggers, Realtime publication membership and storage restrictions.
   `supabase/schema.sql` is the same setup for a fresh project.
2. **Run `supabase/check-launch-readiness.sql`.** It uses generated fixtures
   inside a transaction and rolls them back. It sends no email.
3. **Auth URL configuration.** Set Site URL to the real production domain and
   add `https://<your-production-domain>/reset-password` to Redirect URLs. Add
   `http://localhost:3000/reset-password` for local testing. Keep
   `{{ .ConfirmationURL }}` in the recovery template. A redirect URL that does
   not match is the most likely cause of a broken reset link.
4. **Email delivery.** Confirm whether the project still uses Supabase's
   built-in sender. Its rate limits are not sized for a real cohort; check the
   current limits in the dashboard and decide whether custom SMTP is needed
   before inviting students.
5. **Storage bucket.** Confirm `listing-images` enforces the 5 MB limit and the
   JPEG/PNG/WEBP/GIF type list. The migration sets these; verify on the live
   bucket.
6. **Moderator account.** Choose the confirmed owner account and insert it into
   `public.moderators` using the SQL in the README. Report review stays locked
   until this is done, which is safe but non-functional.
7. **Vercel.** Confirm the project points at this repository and branch, and
   that both `NEXT_PUBLIC_SUPABASE_*` variables are set for Production and
   Preview. Environment changes need a new deployment to take effect.

## Live checks after deployment

Use two verified test accounts and a clearly labelled temporary listing. Remove
it afterwards; do not leave test items among real inventory.

1. **Recovery email, end to end.** Request a reset, open the real email, set a
   new password, sign out, sign in with it. Confirm the old password fails.
   Also try an expired link and a reused link.
2. **Phone, as the seller.** Post an item at Rose Hill or Lincoln Center with a
   real HEIC photo and a large JPEG. Check orientation. Confirm five photos are
   accepted, a sixth is refused clearly, and a file over 20 MB is rejected
   before upload. Check photo removal and reordering in Edit.
3. **Phone, as the buyer.** Find the item through Browse and a campus filter,
   save it, and send a message. Keep both inboxes open and confirm replies and
   unread badges update without refreshing. Disconnect and reconnect: the draft
   should survive a failed send, and retrying must not duplicate a delivered
   message.
4. **Ownership.** As the seller, edit the title and price, mark sold, mark
   available. Confirm Browse hides sold items until Include sold is ticked, and
   that the buyer cannot edit or delete the listing.
5. **Moderation.** Report the test listing as the buyer. The moderator account
   should see it under Profile, remove it, confirm it disappears from Browse and
   its public page, then restore it. Confirm an ordinary account sees nothing at
   `/admin/reports`.
6. **Cleanup.** Delete the test listing as its owner and confirm it leaves
   Browse, Profile and Saved listings. Check the old URL shows the unavailable
   state.

## Real launch inventory

Collect 5 to 10 real available items before inviting the first group. Each owner
posts through their own verified account, with an accurate title, price or Free,
category, campus, condition and 1 to 5 photos. Keep room numbers out of public
descriptions; arrange pickup in messages.

Nothing should be published as inventory without an actual item and a willing
owner. Do not seed the marketplace with invented listings or accounts.

## Open product decision

Signup accepts any `.edu` address, not `@fordham.edu` specifically. That matches
the plan to open to other schools later. If you want Fordham-only for the first
weeks, it needs enforcing at a trusted boundary, not just in the form, and the
accepted domain list should be explicit. Note that a verified school email
proves control of that inbox, not current enrollment, so trust copy should not
overstate it.
