begin;

create or replace function public.current_profile_id()
returns uuid language sql stable security definer
set search_path = pg_catalog, public
as $$ select auth.uid() $$;

create or replace function public.is_active_user()
returns boolean language sql stable security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.active
  )
$$;

create or replace function public.is_project_member(target_project_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, public
as $$
  select public.is_active_user() and exists (
    select 1 from public.project_members pm
    where pm.project_id = target_project_id
      and pm.user_id = auth.uid()
      and pm.active
  )
$$;

create or replace function public.project_access_level(target_project_id uuid)
returns public.user_role language sql stable security definer
set search_path = pg_catalog, public
as $$
  select pm.access_level
  from public.project_members pm
  join public.profiles p on p.id = pm.user_id and p.active
  where pm.project_id = target_project_id
    and pm.user_id = auth.uid()
    and pm.active
  limit 1
$$;

create or replace function public.has_project_role(target_project_id uuid, roles public.user_role[])
returns boolean language sql stable security definer
set search_path = pg_catalog, public
as $$
  select coalesce(public.project_access_level(target_project_id) = any(roles), false)
$$;

create or replace function public.can_view_area(target_area_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.areas a
    where a.id = target_area_id
      and public.is_project_member(a.project_id)
      and (
        public.has_project_role(a.project_id, array['admin']::public.user_role[])
        or exists (
          select 1
          from public.project_members pm
          join public.project_member_areas pma on pma.project_member_id = pm.id
          where pm.project_id = a.project_id
            and pm.user_id = auth.uid()
            and pm.active
            and pma.area_id = a.id
            and pma.can_view
        )
      )
  )
$$;

create or replace function public.can_manage_area(target_area_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.areas a
    where a.id = target_area_id
      and (
        public.has_project_role(a.project_id, array['admin']::public.user_role[])
        or (
          public.has_project_role(a.project_id, array['manager']::public.user_role[])
          and exists (
            select 1
            from public.project_members pm
            join public.project_member_areas pma on pma.project_member_id = pm.id
            where pm.project_id = a.project_id
              and pm.user_id = auth.uid()
              and pm.active
              and pma.area_id = a.id
              and pma.can_manage
          )
        )
      )
  )
$$;

create or replace function public.can_view_task(target_task_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.tasks t
    where t.id = target_task_id
      and t.archived_at is null
      and public.is_project_member(t.project_id)
      and (
        public.has_project_role(t.project_id, array['admin']::public.user_role[])
        or t.primary_responsible_user_id = auth.uid()
        or exists (
          select 1 from public.task_assignees ta
          where ta.task_id = t.id and ta.user_id = auth.uid()
        )
        or (t.area_id is not null and public.can_view_area(t.area_id))
        or (t.area_id is null and public.has_project_role(t.project_id, array['manager','member','viewer']::public.user_role[]))
      )
  )
$$;

create or replace function public.can_update_task(target_task_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.tasks t
    where t.id = target_task_id
      and t.archived_at is null
      and (
        public.has_project_role(t.project_id, array['admin']::public.user_role[])
        or (t.area_id is not null and public.can_manage_area(t.area_id))
        or (
          public.has_project_role(t.project_id, array['member']::public.user_role[])
          and (
            t.primary_responsible_user_id = auth.uid()
            or exists (
              select 1 from public.task_assignees ta
              where ta.task_id = t.id
                and ta.user_id = auth.uid()
                and ta.assignment_type in ('responsible', 'supporting')
            )
          )
        )
      )
  )
$$;

create or replace function public.can_manage_project(target_project_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, public
as $$ select public.has_project_role(target_project_id, array['admin']::public.user_role[]) $$;

revoke all on function public.current_profile_id() from public;
revoke all on function public.is_active_user() from public;
revoke all on function public.is_project_member(uuid) from public;
revoke all on function public.project_access_level(uuid) from public;
revoke all on function public.has_project_role(uuid, public.user_role[]) from public;
revoke all on function public.can_view_area(uuid) from public;
revoke all on function public.can_manage_area(uuid) from public;
revoke all on function public.can_view_task(uuid) from public;
revoke all on function public.can_update_task(uuid) from public;
revoke all on function public.can_manage_project(uuid) from public;
grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.is_active_user() to authenticated;
grant execute on function public.is_project_member(uuid) to authenticated;
grant execute on function public.project_access_level(uuid) to authenticated;
grant execute on function public.has_project_role(uuid, public.user_role[]) to authenticated;
grant execute on function public.can_view_area(uuid) to authenticated;
grant execute on function public.can_manage_area(uuid) to authenticated;
grant execute on function public.can_view_task(uuid) to authenticated;
grant execute on function public.can_update_task(uuid) to authenticated;
grant execute on function public.can_manage_project(uuid) to authenticated;

create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = pg_catalog, public
as $$ begin new.updated_at = now(); return new; end $$;

create or replace function public.normalize_email()
returns trigger language plpgsql
set search_path = pg_catalog, public
as $$ begin new.email = lower(btrim(new.email)); return new; end $$;

create or replace function public.handle_new_auth_user()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public, auth
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    lower(coalesce(new.email, ''))
  );
  return new;
end
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create trigger profiles_normalize_email before insert or update of email on public.profiles
for each row execute function public.normalize_email();
create trigger invitations_normalize_email before insert or update of email on public.invitations
for each row execute function public.normalize_email();

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles','projects','project_members','areas','project_stages','tasks',
    'task_checklist_items','task_comments','project_milestones','project_risks',
    'evidence_categories','project_evidence_items','invitations'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      table_name || '_set_updated_at', table_name
    );
  end loop;
end $$;

create or replace function public.prepare_task_status()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  if new.status = 'blocked' and nullif(btrim(new.blocked_reason), '') is null then
    raise exception 'blocked_reason é obrigatório para tarefas bloqueadas';
  end if;
  if new.status <> 'blocked' then new.blocked_reason := null; end if;

  if new.status = 'completed' then
    if exists (
      select 1 from public.task_checklist_items i
      where i.task_id = new.id and i.required and not i.completed
    ) then raise exception 'Checklist obrigatório incompleto'; end if;
    if new.evidence_required and not exists (
      select 1 from public.task_attachments a
      where a.task_id = new.id and a.deleted_at is null
    ) then raise exception 'A tarefa exige uma evidência ativa'; end if;
    if new.approval_required and new.approved_at is null then
      raise exception 'A tarefa exige aprovação antes da conclusão';
    end if;
    new.completed_at := coalesce(new.completed_at, now());
    new.completion_percentage := 100;
  elsif new.completed_at is not null then
    new.completed_at := null;
  end if;
  return new;
end
$$;
create trigger tasks_prepare_status before insert or update of status, blocked_reason, evidence_required, approval_required, approved_at on public.tasks
for each row execute function public.prepare_task_status();

create or replace function public.prepare_checklist_item()
returns trigger language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if new.completed and not old.completed then
    new.completed_at := now();
    new.completed_by := auth.uid();
  elsif not new.completed then
    new.completed_at := null;
    new.completed_by := null;
  end if;
  return new;
end
$$;
create trigger checklist_prepare_completion before update of completed on public.task_checklist_items
for each row execute function public.prepare_checklist_item();

create or replace function public.recalculate_task_completion()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare target_task_id uuid; total_count integer; completed_count integer;
begin
  target_task_id := coalesce(new.task_id, old.task_id);
  select count(*), count(*) filter (where completed)
  into total_count, completed_count
  from public.task_checklist_items where task_id = target_task_id;

  update public.tasks
  set completion_percentage = case
    when status = 'completed' then 100
    when total_count = 0 then 0
    else round((completed_count::numeric / total_count::numeric) * 100)::integer
  end
  where id = target_task_id;
  return coalesce(new, old);
end
$$;
create trigger checklist_recalculate_task after insert or update of completed or delete on public.task_checklist_items
for each row execute function public.recalculate_task_completion();

create or replace function public.record_task_history()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare field text;
begin
  foreach field in array array[
    'status','priority','due_date','primary_responsible_user_id','blocked_reason',
    'completion_percentage','approved_at','archived_at'
  ] loop
    if to_jsonb(old) -> field is distinct from to_jsonb(new) -> field then
      insert into public.task_history (task_id, user_id, action, field_name, old_value, new_value)
      values (new.id, auth.uid(), 'updated', field, to_jsonb(old) -> field, to_jsonb(new) -> field);
    end if;
  end loop;
  return new;
end
$$;
create trigger tasks_record_history after update on public.tasks
for each row execute function public.record_task_history();

create or replace function public.notify_task_changes()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  if new.primary_responsible_user_id is distinct from old.primary_responsible_user_id
     and new.primary_responsible_user_id is not null then
    insert into public.notifications (user_id, project_id, task_id, title, message, notification_type)
    values (new.primary_responsible_user_id, new.project_id, new.id, 'Nova tarefa atribuída', new.title, 'assignment');
  end if;
  if new.status = 'blocked' and old.status is distinct from 'blocked' then
    insert into public.notifications (user_id, project_id, task_id, title, message, notification_type)
    select pm.user_id, new.project_id, new.id, 'Tarefa bloqueada', new.title, 'blocked'
    from public.project_members pm
    where pm.project_id = new.project_id and pm.active and pm.access_level in ('admin','manager');
  end if;
  return new;
end
$$;
create trigger tasks_notify_changes after update of primary_responsible_user_id, status on public.tasks
for each row execute function public.notify_task_changes();

create or replace function public.notify_new_question()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  if new.comment_type = 'question' then
    insert into public.notifications (user_id, project_id, task_id, title, message, notification_type)
    select distinct recipient.user_id, t.project_id, t.id, 'Nova dúvida em tarefa', t.title, 'question'
    from public.tasks t
    cross join lateral (
      select t.primary_responsible_user_id as user_id
      union
      select pm.user_id from public.project_members pm
      where pm.project_id = t.project_id and pm.active and pm.access_level in ('admin','manager')
    ) recipient
    where t.id = new.task_id and recipient.user_id is not null and recipient.user_id <> new.user_id;
  end if;
  return new;
end
$$;
create trigger comments_notify_question after insert on public.task_comments
for each row execute function public.notify_new_question();

revoke all on function public.handle_new_auth_user() from public;
revoke all on function public.prepare_task_status() from public;
revoke all on function public.recalculate_task_completion() from public;
revoke all on function public.record_task_history() from public;
revoke all on function public.notify_task_changes() from public;
revoke all on function public.notify_new_question() from public;

commit;
