const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createIsolatedDb, asUser, expectDenied, count } = require("./helpers/isolated-db.cjs");

// A denied write in Postgres can either raise or silently affect zero rows, so
// every case below asserts on the protected data rather than on the error.
const SELLER = "11111111-1111-4111-8111-111111111111";
const BUYER = "22222222-2222-4222-8222-222222222222";
const OUTSIDER = "33333333-3333-4333-8333-333333333333";
const MODERATOR = "44444444-4444-4444-8444-444444444444";
const LISTING = "a1111111-1111-4111-8111-111111111111";
const CONVERSATION = "c1111111-1111-4111-8111-111111111111";
const MESSAGE = "d1111111-1111-4111-8111-111111111111";

async function seed(db) {
  await db.exec(`
    insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
    values
      ('${SELLER}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'seller@example.invalid', now(), '{}', '{}'),
      ('${BUYER}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'buyer@example.invalid', now(), '{}', '{}'),
      ('${OUTSIDER}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'outsider@example.invalid', now(), '{}', '{}'),
      ('${MODERATOR}', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'moderator@example.invalid', now(), '{}', '{}');
    insert into public.moderators(user_id) values ('${MODERATOR}');
    insert into public.listings (id, user_id, title, description, price, category, campus, image_url, image_urls, seller_email)
    values ('${LISTING}', '${SELLER}', 'Seller item', 'Owned by the seller', '20.00', 'For Sale', 'Rose Hill', '', array[]::text[], 'seller@example.invalid');
    insert into public.conversations (id, listing_id, buyer_id, seller_id)
    values ('${CONVERSATION}', '${LISTING}', '${BUYER}', '${SELLER}');
    insert into public.messages (id, conversation_id, sender_id, receiver_id, content)
    values ('${MESSAGE}', '${CONVERSATION}', '${BUYER}', '${SELLER}', 'Private to the two of us');
  `);
}

test("an unrelated account cannot reach another pair's listing, conversation or reports", async () => {
  const db = await createIsolatedDb();
  try {
    await seed(db);

    // Reads
    assert.equal(
      (await asUser(db, OUTSIDER, `select * from public.messages where id = '${MESSAGE}'`))[0].rows.length,
      0,
      "outsider must not read messages"
    );
    assert.equal(
      (await asUser(db, OUTSIDER, `select * from public.conversations where id = '${CONVERSATION}'`))[0].rows.length,
      0,
      "outsider must not read conversations"
    );

    // Writing into someone else's thread
    await expectDenied(
      db,
      OUTSIDER,
      `insert into public.messages (conversation_id, sender_id, receiver_id, content)
       values ('${CONVERSATION}', '${OUTSIDER}', '${SELLER}', 'Let me in')`
    );
    assert.equal(
      await count(db, "select count(*)::int as count from public.messages where conversation_id = $1", [CONVERSATION]),
      1,
      "outsider must not append to the thread"
    );

    // Spoofing the sender identity while being a real participant
    await expectDenied(
      db,
      BUYER,
      `insert into public.messages (conversation_id, sender_id, receiver_id, content)
       values ('${CONVERSATION}', '${SELLER}', '${BUYER}', 'Forged from the seller')`
    );
    assert.equal(
      await count(db, "select count(*)::int as count from public.messages where sender_id = $1", [SELLER]),
      0,
      "a participant must not post as the other person"
    );

    // Rewriting who is in the conversation
    await expectDenied(
      db,
      OUTSIDER,
      `update public.conversations set buyer_id = '${OUTSIDER}' where id = '${CONVERSATION}'`
    );
    assert.equal(
      await count(db, "select count(*)::int as count from public.conversations where id = $1 and buyer_id = $2", [
        CONVERSATION,
        BUYER
      ]),
      1,
      "conversation membership must be unchanged"
    );
  } finally {
    await db.close();
  }
});

test("only the owner can change their own listing", async () => {
  const db = await createIsolatedDb();
  try {
    await seed(db);

    await asUser(db, OUTSIDER, `update public.listings set title = 'Hijacked' where id = '${LISTING}'`);
    await asUser(db, OUTSIDER, `update public.listings set sold = true where id = '${LISTING}'`);
    await asUser(db, OUTSIDER, `delete from public.listings where id = '${LISTING}'`);

    const row = (await db.query("select title, sold from public.listings where id = $1", [LISTING])).rows[0];
    assert.equal(row.title, "Seller item", "title must survive a stranger's update");
    assert.equal(row.sold, false, "sold state must survive a stranger's update");

    // Ownership transfer through a crafted update
    await asUser(db, OUTSIDER, `update public.listings set user_id = '${OUTSIDER}' where id = '${LISTING}'`);
    assert.equal(
      await count(db, "select count(*)::int as count from public.listings where id = $1 and user_id = $2", [
        LISTING,
        SELLER
      ]),
      1,
      "ownership must not transfer"
    );

    // Creating a listing owned by someone else
    await expectDenied(
      db,
      OUTSIDER,
      `insert into public.listings (user_id, title, description, price, category, campus, image_url)
       values ('${SELLER}', 'Planted', 'Not really the seller', '1.00', 'For Sale', 'Rose Hill', '')`
    );
    assert.equal(
      await count(db, "select count(*)::int as count from public.listings where user_id = $1", [SELLER]),
      1,
      "a forged owner id must be rejected"
    );
  } finally {
    await db.close();
  }
});

test("moderation and reporting stay restricted to their roles", async () => {
  const db = await createIsolatedDb();
  try {
    await seed(db);

    // Reports are filed as yourself only.
    await expectDenied(
      db,
      OUTSIDER,
      `insert into public.reports (listing_id, reporter_id, reason) values ('${LISTING}', '${BUYER}', 'Spam or scam')`
    );
    assert.equal(
      await count(db, "select count(*)::int as count from public.reports", []),
      0,
      "a report must not be filed in someone else's name"
    );

    await asUser(
      db,
      BUYER,
      `insert into public.reports (listing_id, reporter_id, reason) values ('${LISTING}', '${BUYER}', 'Spam or scam')`
    );
    assert.equal(await count(db, "select count(*)::int as count from public.reports", []), 1);

    await asUser(
      db,
      OUTSIDER,
      `insert into public.reports (listing_id, reporter_id, reason) values ('${LISTING}', '${OUTSIDER}', 'Other')`
    );

    // A reporter sees their own report and nobody else's; moderators see all.
    const buyerVisible = (await asUser(db, BUYER, "select reporter_id from public.reports"))[0].rows;
    assert.equal(buyerVisible.length, 1, "a reporter sees only their own report");
    assert.equal(buyerVisible[0].reporter_id, BUYER);

    assert.equal(
      (await asUser(db, MODERATOR, "select * from public.reports"))[0].rows.length,
      2,
      "a moderator must read the whole report queue"
    );
    assert.equal(
      (await asUser(db, SELLER, "select * from public.reports"))[0].rows.length,
      0,
      "the reported listing's owner must not read reports about it"
    );

    // Taking a listing down is a moderator action.
    await expectDenied(db, OUTSIDER, `insert into public.hidden_listings (listing_id) values ('${LISTING}')`);
    assert.equal(
      await count(db, "select count(*)::int as count from public.hidden_listings", []),
      0,
      "a student must not hide another student's listing"
    );

    // Nobody can promote themselves.
    await expectDenied(db, OUTSIDER, `insert into public.moderators (user_id) values ('${OUTSIDER}')`);
    assert.equal(
      await count(db, "select count(*)::int as count from public.moderators where user_id = $1", [OUTSIDER]),
      0,
      "self promotion must be refused"
    );
  } finally {
    await db.close();
  }
});

test("photo objects belong to the uploader's own folder", async () => {
  const db = await createIsolatedDb();
  try {
    await seed(db);
    await db.exec(
      `insert into storage.objects (bucket_id, name) values ('listing-images', '${SELLER}/fridge.jpg')`
    );

    await expectDenied(
      db,
      OUTSIDER,
      `insert into storage.objects (bucket_id, name) values ('listing-images', '${SELLER}/planted.jpg')`
    );
    assert.equal(
      await count(db, "select count(*)::int as count from storage.objects where name like $1", [`${SELLER}/%`]),
      1,
      "a stranger must not upload into another student's folder"
    );

    await asUser(db, OUTSIDER, `delete from storage.objects where name = '${SELLER}/fridge.jpg'`);
    assert.equal(
      await count(db, "select count(*)::int as count from storage.objects where name = $1", [`${SELLER}/fridge.jpg`]),
      1,
      "a stranger must not delete another student's photo"
    );

    await asUser(
      db,
      OUTSIDER,
      `insert into storage.objects (bucket_id, name) values ('listing-images', '${OUTSIDER}/mine.jpg')`
    );
    assert.equal(
      await count(db, "select count(*)::int as count from storage.objects where name = $1", [`${OUTSIDER}/mine.jpg`]),
      1,
      "a student can upload into their own folder"
    );
  } finally {
    await db.close();
  }
});

test("a signed-out visitor cannot read seller emails", async () => {
  const db = await createIsolatedDb();
  try {
    await seed(db);

    // The rows are public on purpose; the contact column is not.
    const publicColumns = (
      await asUser(db, null, "select id, title, price, campus, sold from public.listings")
    )[0].rows;
    assert.equal(publicColumns.length, 1, "anon can still browse listings");

    const denied = await expectDenied(db, null, "select seller_email from public.listings");
    assert.match(
      String(denied),
      /permission denied/i,
      "anon must be refused the seller_email column"
    );

    // Selecting everything is how the old code read listings, and it must now
    // fail for anon rather than quietly returning the email.
    const deniedStar = await expectDenied(db, null, "select * from public.listings");
    assert.match(String(deniedStar), /permission denied/i, "anon must be refused select *");

    // A signed-in student still gets contact details.
    const asStudent = (
      await asUser(db, BUYER, `select seller_email from public.listings where id = '${LISTING}'`)
    )[0].rows;
    assert.equal(asStudent[0].seller_email, "seller@example.invalid");
  } finally {
    await db.close();
  }
});
