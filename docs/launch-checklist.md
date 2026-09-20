# DormDrop launch checks

## Automated checks included

- Run `npm test` and `npm run build` with the project's public Supabase environment.
- Isolated Postgres exercises listing create/edit/sold/delete, saved listings,
  buyer and seller replies, unread markers, message timestamp updates, duplicate
  IDs, conversation privacy, report privacy, moderator access, removal and restore.
- Component tests cover lost send responses, failed replies preserving drafts,
  incoming updates, unread badges, logout, admin confirmation, photo validation,
  HEIC conversion wiring and resizing.

## Checks after approval and deployment

Use two verified test accounts and a clearly labeled temporary test listing. Remove
the listing when finished; do not leave a test item among real launch inventory.

1. On a phone, sign in as the seller and post an item at Rose Hill or Lincoln Center.
   Upload an actual HEIC photo and a large JPEG; check orientation and appearance.
   Confirm five photos are allowed, a sixth is handled clearly, and a file above
   20 MB is rejected before uploading. Check photo removal and reordering in Edit.
2. As the buyer, open the item, save it and send a message. Keep both accounts'
   inboxes open and confirm replies and unread badges update without refreshing.
   Temporarily disconnect and reconnect; drafts should remain after a failed send
   and retrying should not duplicate a delivered message.
3. As the seller, edit the title/price, mark sold and mark available. Confirm Browse
   hides sold listings until Include sold is enabled. Confirm the buyer cannot edit
   or delete this listing.
4. As the buyer, report the test listing. The designated admin should see the report
   under Profile → Review reported listings. Remove it, check that it disappears
   from public browse and its public detail page, then restore it. Confirm an
   ordinary account sees no report contents at `/admin/reports`.
5. Delete the temporary listing as its owner. Confirm it disappears from Browse,
   Profile and Saved listings. Verify the layout and buttons in Safari on an iPhone
   and at a desktop width.

## Real launch inventory

Collect 5–10 real available items before inviting the first group of students.
Have each owner post through their own verified school account. For every item,
collect its title, price (or Free), category, Rose Hill/Lincoln Center campus,
accurate condition/description, and 1–5 photos. Avoid private room addresses in
public descriptions; arrange pickup in messages.

Real inventory is pending the owners' item details and photos. Nothing should be
published as available inventory without an actual item and willing owner.

## Remaining setup

- Apply the production database update before the matching app deployment.
- Select the confirmed DormDrop account email to receive moderator membership.
- Complete the live two-account and phone checks after deployment.
- Password-recovery URL configuration is deferred separately and is still open.
