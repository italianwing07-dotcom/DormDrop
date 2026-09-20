const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("buyer/seller lifecycle and moderation privileges in isolated Postgres", async () => {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite();
  try {
    // Model the Supabase-owned auth/storage interfaces; application tables and
    // every policy, trigger and function come from the actual schema/migration.
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema auth;
      grant usage on schema auth to anon, authenticated;
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      create table auth.users (
        id uuid primary key, instance_id uuid, aud text, role text, email text,
        email_confirmed_at timestamptz, raw_app_meta_data jsonb, raw_user_meta_data jsonb
      );
      -- The live project has a legacy signup profile trigger whose campus uses
      -- slugs, whereas listings use the display names Rose Hill/Lincoln Center.
      create table public.profiles (
        id uuid primary key references auth.users(id) on delete cascade,
        full_name text, campus text check (campus in ('rose_hill', 'lincoln_center')), grad_year text
      );
      create function public.handle_new_user() returns trigger language plpgsql security definer as $$
      begin
        insert into public.profiles(id, full_name, campus, grad_year)
        values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'campus', new.raw_user_meta_data->>'grad_year');
        return new;
      end;
      $$;
      create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
      create schema storage;
      create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
      alter table storage.objects enable row level security;
      create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name, '/') $$;
    `);
    const root = path.resolve(__dirname, "..");
    const schema = fs.readFileSync(path.join(root, "supabase/schema.sql"), "utf8")
      .replace("create extension if not exists pgcrypto;", "-- gen_random_uuid is built into Postgres");
    await db.exec(schema);
    // The migration must be safe to apply to an already provisioned project too.
    const migration = fs.readFileSync(path.join(root, "supabase/migrations/20260919152913_launch_readiness.sql"), "utf8");
    await db.exec(migration);
    const results = await db.exec(fs.readFileSync(path.join(root, "supabase/check-launch-readiness.sql"), "utf8"));
    assert.ok(results.some((result) => result.rows.some((row) => String(row.result).startsWith("PASS:"))));
    assert.equal((await db.query("select count(*)::int as count from auth.users")).rows[0].count, 0, "fixtures must be rolled back");
    assert.equal((await db.query("select count(*)::int as count from public.listings")).rows[0].count, 0);
    // Existing production stores prices as numeric; new schema installs use
    // text. The same lifecycle must work against both layouts.
    await db.exec("alter table public.listings alter column price type numeric using price::numeric");
    const numericResults = await db.exec(fs.readFileSync(path.join(root, "supabase/check-launch-readiness.sql"), "utf8"));
    assert.ok(numericResults.some((result) => result.rows.some((row) => String(row.result).startsWith("PASS:"))));
    assert.equal((await db.query("select count(*)::int as count from auth.users")).rows[0].count, 0);
  } finally { await db.close(); }
});
