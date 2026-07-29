begin;

-- Vincula o único usuário autenticado existente ao projeto CAFIFA.
-- Relação real: public.profiles.id -> auth.users.id.
-- Idempotência: UNIQUE (project_id, user_id) em public.project_members.

do $$
declare
  matched_user_count integer;
  project_count integer;
  target_user_id uuid;
  target_project_id uuid;
begin
  select count(*), min(u.id::text)::uuid
  into matched_user_count, target_user_id
  from auth.users u
  join public.profiles profile on profile.id = u.id;

  if matched_user_count <> 1 then
    raise exception
      'Vínculo cancelado: esperado exatamente 1 auth.users com profile correspondente; encontrados %',
      matched_user_count;
  end if;

  select count(*), min(id::text)::uuid
  into project_count, target_project_id
  from public.projects
  where slug = 'cafifa-operacoes';

  if project_count <> 1 then
    raise exception
      'Vínculo cancelado: esperado exatamente 1 projeto cafifa-operacoes; encontrados %',
      project_count;
  end if;

  insert into public.project_members (
    project_id,
    user_id,
    access_level,
    active,
    invited_by,
    joined_at
  )
  values (
    target_project_id,
    target_user_id,
    'admin'::public.user_role,
    true,
    target_user_id,
    now()
  )
  on conflict (project_id, user_id) do update
  set
    access_level = 'admin'::public.user_role,
    active = true,
    joined_at = coalesce(public.project_members.joined_at, excluded.joined_at),
    updated_at = now();
end
$$;

commit;

select
  pm.id as project_member_id,
  project.id as project_id,
  project.name as project_name,
  profile.id as profile_id,
  profile.full_name,
  profile.email,
  pm.access_level,
  pm.active,
  pm.joined_at
from public.project_members pm
join public.projects project on project.id = pm.project_id
join public.profiles profile on profile.id = pm.user_id
join auth.users auth_user on auth_user.id = profile.id
where project.slug = 'cafifa-operacoes'
  and pm.access_level = 'admin'::public.user_role
order by pm.created_at
limit 1;
