-- Run after the launch readiness migration. Every fixture is rolled back.
begin;
create function pg_temp.assert_ok(ok boolean, detail text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAILED: %', detail; end if; end;
$$;
create temporary table qa_ids (seller uuid, buyer uuid, outsider uuid, moderator uuid, listing uuid, conversation uuid, message uuid, report uuid);
insert into qa_ids select gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),gen_random_uuid();
grant select on qa_ids to authenticated, anon;

insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
select id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'dormdrop-qa-' || id || '@example.invalid', now(), '{"provider":"email"}',
  '{"full_name":"DormDrop QA fixture","campus":"Rose Hill","grad_year":"2028"}'
from qa_ids cross join lateral unnest(array[seller,buyer,outsider,moderator]) id;
insert into public.moderators(user_id) select moderator from qa_ids;

set local role authenticated;
select set_config('request.jwt.claim.sub', (select seller::text from qa_ids), true);
insert into public.listings(id,user_id,title,description,price,category,campus,image_url,image_urls)
select listing,seller,'QA rollback item','Not a real listing','$10','For Sale','Rose Hill','',array[]::text[] from qa_ids;
update public.listings set title='QA edited item', sold=true where id=(select listing from qa_ids);
select pg_temp.assert_ok((select sold and title='QA edited item' from public.listings where id=(select listing from qa_ids)), 'seller can edit and mark sold');
update public.listings set sold=false where id=(select listing from qa_ids);

select set_config('request.jwt.claim.sub', (select buyer::text from qa_ids), true);
update public.listings set title='Unauthorized edit' where id=(select listing from qa_ids);
select pg_temp.assert_ok((select title='QA edited item' from public.listings where id=(select listing from qa_ids)), 'buyer cannot edit another seller listing');
insert into public.saved_listings(user_id,listing_id) select buyer,listing from qa_ids;
insert into public.conversations(id,listing_id,buyer_id,seller_id) select conversation,listing,buyer,seller from qa_ids;
insert into public.messages(id,conversation_id,sender_id,receiver_id,content,created_at)
select message,conversation,buyer,seller,'QA buyer message','2000-01-01'::timestamptz from qa_ids;
select pg_temp.assert_ok((select m.created_at=c.last_message_at and m.created_at > '2026-01-01' from public.messages m join public.conversations c on c.id=m.conversation_id where m.id=(select message from qa_ids)), 'message and inbox timestamp update atomically with server time');
do $$ begin
  begin
    insert into public.messages(id,conversation_id,sender_id,receiver_id,content) select message,conversation,buyer,seller,'QA buyer message' from qa_ids;
    raise exception 'FAILED: duplicate message accepted';
  exception when unique_violation then null; end;
  begin
    update public.conversations set seller_last_read_at=now() where id=(select conversation from qa_ids);
    raise exception 'FAILED: buyer changed seller read state';
  exception when insufficient_privilege then null; end;
  begin
    update public.conversations set seller_id=(select outsider from qa_ids) where id=(select conversation from qa_ids);
    raise exception 'FAILED: buyer changed conversation membership';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.messages(conversation_id,sender_id,receiver_id,content) select conversation,buyer,seller,repeat('x',4001) from qa_ids;
    raise exception 'FAILED: oversized message accepted';
  exception when check_violation then null; end;
end $$;
insert into public.reports(id,listing_id,reporter_id,reason,details) select report,listing,buyer,'Spam or scam','QA report' from qa_ids;
do $$ begin
  begin
    perform public.review_report((select report from qa_ids),'remove');
    raise exception 'FAILED: ordinary user moderated a report';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.moderators(user_id) select buyer from qa_ids;
    raise exception 'FAILED: self promotion to moderator';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claim.sub', (select seller::text from qa_ids), true);
select pg_temp.assert_ok((select count(*)=1 from public.messages where conversation_id=(select conversation from qa_ids)), 'seller sees buyer message');
update public.conversations set seller_last_read_at=(select created_at from public.messages where id=(select message from qa_ids)) where id=(select conversation from qa_ids);
insert into public.messages(conversation_id,sender_id,receiver_id,content) select conversation,seller,buyer,'QA seller reply' from qa_ids;
select pg_temp.assert_ok((select count(*)=0 from public.reports where id=(select report from qa_ids)), 'seller cannot read buyer report');

select set_config('request.jwt.claim.sub', (select outsider::text from qa_ids), true);
select pg_temp.assert_ok((select count(*)=0 from public.messages where conversation_id=(select conversation from qa_ids)), 'outsider cannot read messages');
select pg_temp.assert_ok((select count(*)=0 from public.conversations where id=(select conversation from qa_ids)), 'outsider cannot read conversations');
select pg_temp.assert_ok((select count(*)=0 from public.reports where id=(select report from qa_ids)), 'outsider cannot read reports');
do $$ begin
  begin
    insert into public.messages(conversation_id,sender_id,receiver_id,content) select conversation,outsider,seller,'Unauthorized' from qa_ids;
    raise exception 'FAILED: outsider sent a message';
  exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claim.sub', (select moderator::text from qa_ids), true);
select pg_temp.assert_ok(public.is_moderator(), 'provisioned moderator is recognized');
select pg_temp.assert_ok((select count(*)=1 from public.reports where id=(select report from qa_ids)), 'moderator can review report');
select public.review_report((select report from qa_ids),'remove');
select pg_temp.assert_ok((select status='resolved' and reviewed_by=(select moderator from qa_ids) from public.reports where id=(select report from qa_ids)), 'removal resolves report with reviewer');

set local role anon;
select set_config('request.jwt.claim.sub','',true);
select pg_temp.assert_ok((select count(*)=0 from public.listings where id=(select listing from qa_ids)), 'removed listing is hidden from public');
set local role authenticated;
select set_config('request.jwt.claim.sub', (select seller::text from qa_ids), true);
select pg_temp.assert_ok((select count(*)=1 from public.listings where id=(select listing from qa_ids)), 'owner retains access to removed listing');
delete from public.hidden_listings where listing_id=(select listing from qa_ids);
select pg_temp.assert_ok((select count(*)=1 from public.hidden_listings where listing_id=(select listing from qa_ids)), 'owner cannot reverse removal');
select set_config('request.jwt.claim.sub', (select buyer::text from qa_ids), true);
select pg_temp.assert_ok((select count(*)=0 from public.listings where id=(select listing from qa_ids)), 'removed listing hidden from other students');
select pg_temp.assert_ok((select count(*)=2 from public.messages where conversation_id=(select conversation from qa_ids)), 'moderation preserves conversation history');

select set_config('request.jwt.claim.sub', (select moderator::text from qa_ids), true);
select public.review_report((select report from qa_ids),'restore');
set local role anon;
select set_config('request.jwt.claim.sub','',true);
select pg_temp.assert_ok((select count(*)=1 from public.listings where id=(select listing from qa_ids)), 'restored listing is public');

set local role authenticated;
select set_config('request.jwt.claim.sub', (select seller::text from qa_ids), true);
delete from public.listings where id=(select listing from qa_ids);
select pg_temp.assert_ok((select count(*)=0 from public.listings where id=(select listing from qa_ids)), 'seller can delete own listing');
reset role;
select pg_temp.assert_ok((select count(*)=0 from public.messages where conversation_id=(select conversation from qa_ids)), 'deleted listing cleans up conversation messages');
select pg_temp.assert_ok((select file_size_limit=5242880 and allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif'] from storage.buckets where id='listing-images'), 'storage enforces type and size limits');
select pg_temp.assert_ok((select count(*)=2 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename in ('messages','conversations')), 'realtime publication configured');
select 'PASS: buyer/seller lifecycle, privacy, moderation, messaging, and upload configuration' as result;
rollback;
