-- Ejecutar después de invitar o crear ambos usuarios en Authentication > Users.
-- No contiene contraseñas ni claves secretas.

do $$
declare admin_id uuid; adult_id uuid;
begin
  select id into admin_id from auth.users where lower(email)='jufantics@gmail.com';
  select id into adult_id from auth.users where lower(email)='lpberrospia@gmail.com';

  if admin_id is null then
    raise exception 'Falta crear o invitar jufantics@gmail.com';
  end if;
  if adult_id is null then
    raise exception 'Falta crear o invitar lpberrospia@gmail.com';
  end if;

  insert into public.profiles(user_id,role,display_name)
  values(admin_id,'admin','Administración JUFANTICS')
  on conflict(user_id) do update set role='admin',display_name=excluded.display_name,updated_at=now();

  insert into public.profiles(user_id,role,display_name)
  values(adult_id,'adult','Cuenta adulta de prueba')
  on conflict(user_id) do update set role='adult',display_name=excluded.display_name,updated_at=now();

  insert into public.households(
    owner_user_id,plan,profile_limit,status,regular_price_pen,discount_pen,total_paid_pen,starts_at,expires_at
  ) values(
    adult_id,'annual',2,'active',50.00,50.00,0.00,now(),now()+interval '1 year'
  )
  on conflict(owner_user_id) do update set
    plan='annual',profile_limit=2,status='active',regular_price_pen=50.00,
    discount_pen=50.00,total_paid_pen=0.00,starts_at=now(),expires_at=now()+interval '1 year',updated_at=now();
end $$;

-- Cuando se confirmen los alias de los menores, reemplazar los textos y ejecutar:
-- insert into public.child_profiles(household_id,alias)
-- select id,'ALIAS_MENOR_1' from public.households h
-- join auth.users u on u.id=h.owner_user_id where lower(u.email)='lpberrospia@gmail.com';
-- insert into public.child_profiles(household_id,alias)
-- select id,'ALIAS_MENOR_2' from public.households h
-- join auth.users u on u.id=h.owner_user_id where lower(u.email)='lpberrospia@gmail.com';

