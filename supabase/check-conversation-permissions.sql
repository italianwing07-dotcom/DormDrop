-- Run after schema.sql. Checks permissions without reading or changing user data.
begin;
set local role authenticated;

-- Both inbox update shapes must remain permitted.
update public.conversations
set buyer_last_read_at = now(), last_message_at = now() where false;
update public.conversations
set seller_last_read_at = now(), last_message_at = now() where false;

do $$
begin
  begin
    update public.conversations set seller_id = buyer_id where false;
    raise exception 'FAIL: seller changes allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.conversations set buyer_id = seller_id where false;
    raise exception 'FAIL: buyer changes allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.conversations set listing_id = id where false;
    raise exception 'FAIL: listing changes allowed';
  exception when insufficient_privilege then null;
  end;
end $$;

rollback;
