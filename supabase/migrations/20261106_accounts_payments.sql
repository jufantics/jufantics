-- JUFANTICS: solicitudes privadas de plan y operaciones administrativas.
-- Ejecutar despues de supabase/schema.sql.

do $$ begin
  create type public.jufantics_payment_status as enum ('requested','under_review','approved','rejected','cancelled');
exception when duplicate_object then null; end $$;

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  requested_plan public.jufantics_plan not null,
  status public.jufantics_payment_status not null default 'requested',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_operations (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null references auth.users(id),
  target_user_id uuid references auth.users(id),
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists payment_requests_owner_idx on public.payment_requests(owner_user_id,created_at desc);
create index if not exists admin_operations_target_idx on public.admin_operations(target_user_id,created_at desc);

alter table public.payment_requests enable row level security;
alter table public.admin_operations enable row level security;
revoke all on public.payment_requests,public.admin_operations from anon,authenticated;
grant select on public.payment_requests,public.admin_operations to authenticated;

drop policy if exists payment_requests_select on public.payment_requests;
create policy payment_requests_select on public.payment_requests for select to authenticated
using ((select auth.uid())=owner_user_id or public.jufantics_is_admin());

drop policy if exists admin_operations_select on public.admin_operations;
create policy admin_operations_select on public.admin_operations for select to authenticated
using (public.jufantics_is_admin());

create or replace function public.jufantics_request_plan(requested_plan text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare new_id uuid; selected_plan public.jufantics_plan;
begin
  if (select auth.uid()) is null then raise exception 'Debes iniciar sesion'; end if;
  if not exists (
    select 1 from public.profiles
    where user_id=(select auth.uid()) and role='adult'
  ) then raise exception 'Solo una cuenta adulta puede solicitar un plan'; end if;
  if requested_plan not in ('monthly','annual') then raise exception 'Plan no valido'; end if;
  selected_plan:=requested_plan::public.jufantics_plan;

  select r.id into new_id from public.payment_requests r
  where r.owner_user_id=(select auth.uid()) and r.requested_plan=selected_plan
    and r.status in ('requested','under_review')
  order by r.created_at desc limit 1;

  if new_id is null then
    insert into public.payment_requests(owner_user_id,requested_plan)
    values((select auth.uid()),selected_plan) returning id into new_id;
  end if;
  return new_id;
end;
$$;

create or replace function public.jufantics_admin_accounts()
returns table(
  user_id uuid,email text,display_name text,role text,
  household_id uuid,plan text,profile_limit smallint,subscription_status text,
  starts_at timestamptz,expires_at timestamptz,total_paid_pen numeric,
  child_profiles jsonb,latest_request_status text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.jufantics_is_admin() then raise exception 'Acceso administrativo requerido'; end if;
  return query
  select u.id,u.email::text,p.display_name,p.role::text,
    h.id,h.plan::text,h.profile_limit,h.status::text,h.starts_at,h.expires_at,h.total_paid_pen,
    coalesce(children.items,'[]'::jsonb),request.status::text
  from auth.users u
  join public.profiles p on p.user_id=u.id
  left join public.households h on h.owner_user_id=u.id
  left join lateral (
    select jsonb_agg(jsonb_build_object('id',c.id,'alias',c.alias,'active',c.active) order by c.created_at) items
    from public.child_profiles c where c.household_id=h.id
  ) children on true
  left join lateral (
    select r.status from public.payment_requests r where r.owner_user_id=u.id order by r.created_at desc limit 1
  ) request on true
  order by u.email;
end;
$$;

create or replace function public.jufantics_admin_set_subscription(
  target_user uuid,target_plan text,target_status text,payment_amount numeric,verification_reference text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare result_household_id uuid; selected_plan public.jufantics_plan; selected_status public.jufantics_subscription_status;
  regular_amount numeric(8,2); selected_limit smallint; expiry timestamptz;
begin
  if not public.jufantics_is_admin() then raise exception 'Acceso administrativo requerido'; end if;
  if not exists (
    select 1 from public.profiles where user_id=target_user and role='adult'
  ) then raise exception 'La suscripcion solo puede asignarse a una cuenta adulta'; end if;
  if target_plan not in ('monthly','annual') then raise exception 'Plan no valido'; end if;
  if target_status not in ('pending','active','expired','cancelled') then raise exception 'Estado no valido'; end if;
  if trim(coalesce(verification_reference,''))='' then raise exception 'Registra la referencia privada de verificacion'; end if;
  if payment_amount<0 then raise exception 'Monto no valido'; end if;

  selected_plan:=target_plan::public.jufantics_plan;
  selected_status:=target_status::public.jufantics_subscription_status;
  selected_limit:=case when selected_plan='monthly' then 1 else 2 end;
  regular_amount:=case when selected_plan='monthly' then 9.90 else 50.00 end;
  if payment_amount>regular_amount then raise exception 'El monto supera el precio del plan'; end if;
  expiry:=case
    when selected_status<>'active' then now()
    when selected_plan='monthly' then now()+interval '1 month'
    else now()+interval '1 year'
  end;

  insert into public.households(owner_user_id,plan,profile_limit,status,regular_price_pen,discount_pen,total_paid_pen,starts_at,expires_at)
  values(target_user,selected_plan,selected_limit,selected_status,regular_amount,greatest(regular_amount-payment_amount,0),payment_amount,now(),expiry)
  on conflict(owner_user_id) do update set
    plan=excluded.plan,profile_limit=excluded.profile_limit,status=excluded.status,
    regular_price_pen=excluded.regular_price_pen,discount_pen=excluded.discount_pen,total_paid_pen=excluded.total_paid_pen,
    starts_at=excluded.starts_at,expires_at=excluded.expires_at,updated_at=now()
  returning id into result_household_id;

  -- Al bajar al plan mensual se conserva el perfil infantil mas antiguo
  -- y se desactivan los adicionales sin borrar sus datos.
  if selected_plan='monthly' then
    update public.child_profiles
    set active=false,updated_at=now()
    where household_id=result_household_id and active
      and id not in (
        select id from public.child_profiles
        where household_id=result_household_id and active
        order by created_at,id limit 1
      );
  end if;

  if selected_status='active' then
    update public.payment_requests set status='approved',reviewed_at=now(),reviewed_by=(select auth.uid()),updated_at=now()
    where id=(select id from public.payment_requests where owner_user_id=target_user and status in ('requested','under_review') order by created_at desc limit 1);
  elsif selected_status='cancelled' then
    update public.payment_requests set status='cancelled',reviewed_at=now(),reviewed_by=(select auth.uid()),updated_at=now()
    where id=(select id from public.payment_requests where owner_user_id=target_user and status in ('requested','under_review') order by created_at desc limit 1);
  end if;

  insert into public.admin_operations(actor_user_id,target_user_id,action,details)
  values((select auth.uid()),target_user,'subscription_'||selected_status::text,
    jsonb_build_object('plan',selected_plan,'amount',payment_amount,'verification_reference',verification_reference));
  return result_household_id;
end;
$$;

revoke all on function public.jufantics_request_plan(text) from public;
revoke all on function public.jufantics_admin_accounts() from public;
revoke all on function public.jufantics_admin_set_subscription(uuid,text,text,numeric,text) from public;
grant execute on function public.jufantics_request_plan(text) to authenticated;
grant execute on function public.jufantics_admin_accounts() to authenticated;
grant execute on function public.jufantics_admin_set_subscription(uuid,text,text,numeric,text) to authenticated;
