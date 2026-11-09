-- JUFANTICS: verificacion de cuentas, planes y seguridad.
-- Ejecutar despues de schema.sql, 20261106_accounts_payments.sql y seed_accounts.sql.
-- Es solo lectura: no modifica usuarios, planes ni perfiles.

select
  case when count(*) filter (where lower(u.email)='jufantics@gmail.com' and p.role='admin')=1
    then 'OK' else 'REVISAR' end as cuenta_administradora,
  case when count(*) filter (where lower(u.email)='lpberrospia@gmail.com' and p.role='adult')=1
    then 'OK' else 'REVISAR' end as cuenta_adulta
from auth.users u
left join public.profiles p on p.user_id=u.id
where lower(u.email) in ('jufantics@gmail.com','lpberrospia@gmail.com');

select
  u.email,
  h.plan,
  h.profile_limit,
  h.status,
  h.total_paid_pen,
  h.starts_at,
  h.expires_at,
  count(c.id) filter (where c.active) as perfiles_activos,
  case
    when h.plan='monthly' and h.profile_limit=1 and count(c.id) filter (where c.active)<=1 then 'OK'
    when h.plan='annual' and h.profile_limit=2 and count(c.id) filter (where c.active)<=2 then 'OK'
    else 'REVISAR'
  end as limite_perfiles
from auth.users u
join public.households h on h.owner_user_id=u.id
left join public.child_profiles c on c.household_id=h.id
where lower(u.email)='lpberrospia@gmail.com'
group by u.email,h.id;

select schemaname,tablename,policyname,roles,cmd
from pg_policies
where schemaname in ('public','storage')
  and tablename in ('profiles','households','child_profiles','payment_requests','admin_operations','objects')
order by schemaname,tablename,policyname;

select routine_name,security_type
from information_schema.routines
where routine_schema='public'
  and routine_name like 'jufantics_%'
order by routine_name;
