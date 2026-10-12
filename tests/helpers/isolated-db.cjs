const fs = require("node:fs");
const path = require("node:path");

// Spins up an isolated Postgres that models the Supabase-owned auth/storage
// interfaces, then applies the project's real schema and migration so policies,
// triggers and functions under test are the ones that ship.
async function createIsolatedDb() {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = new PGlite();

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
    create schema storage;
    grant usage on schema storage to anon, authenticated;
    create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
    alter table storage.objects enable row level security;
    grant select, insert, update, delete on storage.objects to authenticated;
    grant select on storage.objects to anon;
    create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name, '/') $$;
  `);

  const root = path.resolve(__dirname, "..", "..");
  const schema = fs
    .readFileSync(path.join(root, "supabase/schema.sql"), "utf8")
    .replace("create extension if not exists pgcrypto;", "-- gen_random_uuid is built into Postgres");
  await db.exec(schema);
  await db.exec(fs.readFileSync(path.join(root, "supabase/migrations/20260919152913_launch_readiness.sql"), "utf8"));

  return db;
}

// Runs a statement as a signed-in student (or as anon when userId is null).
async function asUser(db, userId, sql) {
  await db.exec("reset role;");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId ?? ""]);
  await db.exec(`set role ${userId ? "authenticated" : "anon"};`);
  try {
    return await db.exec(sql);
  } finally {
    await db.exec("reset role;");
  }
}

// Asserts a statement is refused outright (policy/privilege error).
async function expectDenied(db, userId, sql) {
  try {
    await asUser(db, userId, sql);
  } catch (error) {
    return String(error.message || error);
  }
  return null;
}

async function count(db, sql, params = []) {
  const result = await db.query(sql, params);
  return Number(result.rows[0].count);
}

module.exports = { createIsolatedDb, asUser, expectDenied, count };
