-- JUFANTICS: autenticación, hogares, planes y perfiles infantiles.
-- Ejecutar una sola vez en el SQL Editor de un proyecto Supabase nuevo.

create extension if not exists pgcrypto;

do $$ begin
  create type public.jufantics_role as enum ('admin','adult');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.jufantics_plan as enum ('monthly','annual');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.jufantics_subscription_status as enum ('pending','active','expired','cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.jufantics_role not null default 'adult',
  display_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique references auth.users(id) on delete cascade,
  plan public.jufantics_plan not null,
  profile_limit smallint not null check (profile_limit in (1,2)),
  status public.jufantics_subscription_status not null default 'pending',
  regular_price_pen numeric(8,2) not null default 0,
  discount_pen numeric(8,2) not null default 0,
  total_paid_pen numeric(8,2) not null default 0,
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint household_plan_limit check (
    (plan='monthly' and profile_limit=1) or
    (plan='annual' and profile_limit=2)
  )
);

create table if not exists public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  alias text not null check (char_length(trim(alias)) between 1 and 40),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(household_id,alias)
);

create index if not exists households_owner_idx on public.households(owner_user_id);
create index if not exists households_status_expiry_idx on public.households(status,expires_at);
create index if not exists child_profiles_household_idx on public.child_profiles(household_id);

create or replace function public.jufantics_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where user_id=(select auth.uid()) and role='admin'
  );
$$;

create or replace function public.jufantics_has_active_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.jufantics_is_admin() or exists (
    select 1 from public.households
    where owner_user_id=(select auth.uid())
      and status='active'
      and starts_at<=now()
      and expires_at>now()
  );
$$;

create or replace function public.jufantics_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles(user_id,role,display_name)
  values(new.id,'adult',coalesce(new.raw_user_meta_data->>'display_name',''))
  on conflict(user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists jufantics_auth_user_created on auth.users;
create trigger jufantics_auth_user_created
after insert on auth.users
for each row execute procedure public.jufantics_new_user_profile();

create or replace function public.jufantics_enforce_child_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare allowed smallint; current_count integer;
begin
  select profile_limit into allowed from public.households where id=new.household_id;
  select count(*) into current_count from public.child_profiles
    where household_id=new.household_id and active and id<>new.id;
  if allowed is null or (new.active and current_count>=allowed) then
    raise exception 'Se alcanzó el límite de perfiles infantiles del plan';
  end if;
  return new;
end;
$$;

drop trigger if exists jufantics_child_limit on public.child_profiles;
create trigger jufantics_child_limit
before insert or update on public.child_profiles
for each row execute procedure public.jufantics_enforce_child_limit();

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.child_profiles enable row level security;

revoke all on public.profiles,public.households,public.child_profiles from anon,authenticated;
grant select on public.profiles,public.households,public.child_profiles to authenticated;
grant insert,update,delete on public.child_profiles to authenticated;
revoke all on function public.jufantics_is_admin() from public;
revoke all on function public.jufantics_has_active_access() from public;
grant execute on function public.jufantics_is_admin() to authenticated;
grant execute on function public.jufantics_has_active_access() to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
using ((select auth.uid())=user_id or public.jufantics_is_admin());

drop policy if exists households_select on public.households;
create policy households_select on public.households for select to authenticated
using ((select auth.uid())=owner_user_id or public.jufantics_is_admin());

drop policy if exists child_profiles_select on public.child_profiles;
create policy child_profiles_select on public.child_profiles for select to authenticated
using (public.jufantics_is_admin() or exists (
  select 1 from public.households h
  where h.id=household_id and h.owner_user_id=(select auth.uid())
));

drop policy if exists child_profiles_insert on public.child_profiles;
create policy child_profiles_insert on public.child_profiles for insert to authenticated
with check (exists (
  select 1 from public.households h
  where h.id=household_id and h.owner_user_id=(select auth.uid())
));

drop policy if exists child_profiles_update on public.child_profiles;
create policy child_profiles_update on public.child_profiles for update to authenticated
using (exists (
  select 1 from public.households h
  where h.id=household_id and h.owner_user_id=(select auth.uid())
))
with check (exists (
  select 1 from public.households h
  where h.id=household_id and h.owner_user_id=(select auth.uid())
));

drop policy if exists child_profiles_delete on public.child_profiles;
create policy child_profiles_delete on public.child_profiles for delete to authenticated
using (exists (
  select 1 from public.households h
  where h.id=household_id and h.owner_user_id=(select auth.uid())
));

-- El bucket es privado. Las páginas premium deben migrarse aquí antes de cobrar.
insert into storage.buckets(id,name,public)
values('premium-stories','premium-stories',false)
on conflict(id) do update set public=false;

drop policy if exists premium_stories_read on storage.objects;
create policy premium_stories_read on storage.objects for select to authenticated
using (bucket_id='premium-stories' and public.jufantics_has_active_access());

