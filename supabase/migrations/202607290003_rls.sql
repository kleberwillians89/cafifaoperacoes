begin;

create or replace function public.can_manage_profile(target_profile_id uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.project_members target
    join public.project_members actor on actor.project_id = target.project_id
    join public.profiles actor_profile on actor_profile.id = actor.user_id and actor_profile.active
    where target.user_id = target_profile_id
      and actor.user_id = auth.uid()
      and actor.active
      and actor.access_level = 'admin'
  )
$$;
revoke all on function public.can_manage_profile(uuid) from public;
grant execute on function public.can_manage_profile(uuid) to authenticated;

create or replace function public.protect_profile_security_fields()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  if (new.global_role is distinct from old.global_role or new.active is distinct from old.active)
     and not public.can_manage_profile(old.id) then
    raise exception 'Somente um administrador autorizado pode alterar papel ou atividade';
  end if;
  if new.email is distinct from old.email and auth.uid() = old.id then
    raise exception 'O e-mail deve ser alterado pelo fluxo seguro de autenticação';
  end if;
  return new;
end
$$;
create trigger profiles_protect_security before update on public.profiles
for each row execute function public.protect_profile_security_fields();
revoke all on function public.protect_profile_security_fields() from public;

create or replace function public.protect_task_admin_fields()
returns trigger language plpgsql security definer
set search_path = pg_catalog, public
as $$
begin
  if new.archived_at is distinct from old.archived_at
     and not public.can_manage_project(old.project_id) then
    raise exception 'Somente admin pode arquivar ou reabrir tarefa';
  end if;
  if public.project_access_level(old.project_id) = 'member'
     and (
       to_jsonb(new) - array['status','blocked_reason','completed_at','completion_percentage','updated_at']
       is distinct from
       to_jsonb(old) - array['status','blocked_reason','completed_at','completion_percentage','updated_at']
     ) then
    raise exception 'Integrantes podem alterar somente a execução da tarefa';
  end if;
  return new;
end
$$;
create trigger tasks_protect_admin_fields before update on public.tasks
for each row execute function public.protect_task_admin_fields();
revoke all on function public.protect_task_admin_fields() from public;

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles','projects','project_members','project_member_areas','areas','project_stages',
    'tasks','task_assignees','task_checklist_items','task_comments','task_attachments',
    'task_history','project_milestones','task_milestones','project_risks',
    'evidence_categories','project_evidence_items','invitations','notifications'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
  end loop;
end $$;

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

create policy profiles_select on public.profiles for select to authenticated using (
  public.is_active_user() and (
    id = auth.uid() or exists (
      select 1 from public.project_members mine
      join public.project_members theirs on theirs.project_id = mine.project_id
      where mine.user_id = auth.uid() and mine.active
        and theirs.user_id = profiles.id and theirs.active
    )
  )
);
create policy profiles_update on public.profiles for update to authenticated
using (id = auth.uid() or public.can_manage_profile(id))
with check (id = auth.uid() or public.can_manage_profile(id));

create policy projects_select on public.projects for select to authenticated
using (public.is_project_member(id));
create policy projects_update on public.projects for update to authenticated
using (public.can_manage_project(id)) with check (public.can_manage_project(id));

create policy project_members_select on public.project_members for select to authenticated
using (public.is_project_member(project_id));
create policy project_members_insert on public.project_members for insert to authenticated
with check (public.can_manage_project(project_id));
create policy project_members_update on public.project_members for update to authenticated
using (public.can_manage_project(project_id)) with check (public.can_manage_project(project_id));
create policy project_members_delete on public.project_members for delete to authenticated
using (public.can_manage_project(project_id));

create policy project_member_areas_select on public.project_member_areas for select to authenticated
using (exists (
  select 1 from public.project_members pm
  where pm.id = project_member_id and public.is_project_member(pm.project_id)
));
create policy project_member_areas_insert on public.project_member_areas for insert to authenticated
with check (
  exists (
    select 1 from public.project_members pm join public.areas a on a.project_id = pm.project_id
    where pm.id = project_member_id and a.id = area_id
      and (public.can_manage_project(pm.project_id) or public.can_manage_area(a.id))
  )
);
create policy project_member_areas_update on public.project_member_areas for update to authenticated
using (exists (
  select 1 from public.project_members pm join public.areas a on a.project_id = pm.project_id
  where pm.id = project_member_id and a.id = area_id
    and (public.can_manage_project(pm.project_id) or public.can_manage_area(a.id))
));
create policy project_member_areas_delete on public.project_member_areas for delete to authenticated
using (exists (
  select 1 from public.project_members pm join public.areas a on a.project_id = pm.project_id
  where pm.id = project_member_id and a.id = area_id
    and (public.can_manage_project(pm.project_id) or public.can_manage_area(a.id))
));

create policy areas_select on public.areas for select to authenticated
using (public.is_project_member(project_id));
create policy areas_insert on public.areas for insert to authenticated
with check (public.can_manage_project(project_id));
create policy areas_update on public.areas for update to authenticated
using (public.can_manage_project(project_id) or public.can_manage_area(id))
with check (public.can_manage_project(project_id) or public.can_manage_area(id));

create policy stages_select on public.project_stages for select to authenticated
using (public.is_project_member(project_id));
create policy stages_manage on public.project_stages for all to authenticated
using (public.can_manage_project(project_id)) with check (public.can_manage_project(project_id));

create policy tasks_select on public.tasks for select to authenticated
using (public.can_view_task(id));
create policy tasks_insert on public.tasks for insert to authenticated
with check (
  public.can_manage_project(project_id)
  or (
    public.has_project_role(project_id, array['manager']::public.user_role[])
    and area_id is not null and public.can_manage_area(area_id)
  )
);
create policy tasks_update on public.tasks for update to authenticated
using (public.can_update_task(id)) with check (public.can_update_task(id));
create policy tasks_delete on public.tasks for delete to authenticated
using (public.can_manage_project(project_id));

create policy task_assignees_select on public.task_assignees for select to authenticated
using (public.can_view_task(task_id));
create policy task_assignees_insert on public.task_assignees for insert to authenticated
with check (exists (
  select 1 from public.tasks t where t.id = task_id
    and (public.can_manage_project(t.project_id) or (t.area_id is not null and public.can_manage_area(t.area_id)))
));
create policy task_assignees_update on public.task_assignees for update to authenticated
using (exists (
  select 1 from public.tasks t where t.id = task_id
    and (public.can_manage_project(t.project_id) or (t.area_id is not null and public.can_manage_area(t.area_id)))
));
create policy task_assignees_delete on public.task_assignees for delete to authenticated
using (exists (
  select 1 from public.tasks t where t.id = task_id
    and (public.can_manage_project(t.project_id) or (t.area_id is not null and public.can_manage_area(t.area_id)))
));

create policy checklist_select on public.task_checklist_items for select to authenticated
using (public.can_view_task(task_id));
create policy checklist_insert on public.task_checklist_items for insert to authenticated
with check (exists (
  select 1 from public.tasks t where t.id = task_id
    and (public.can_manage_project(t.project_id) or (t.area_id is not null and public.can_manage_area(t.area_id)))
));
create policy checklist_update on public.task_checklist_items for update to authenticated
using (
  public.can_update_task(task_id)
  or exists (select 1 from public.task_assignees ta where ta.task_id = task_id and ta.user_id = auth.uid() and ta.assignment_type in ('responsible','supporting'))
);
create policy checklist_delete on public.task_checklist_items for delete to authenticated
using (exists (
  select 1 from public.tasks t where t.id = task_id
    and (public.can_manage_project(t.project_id) or (t.area_id is not null and public.can_manage_area(t.area_id)))
));

create policy comments_select on public.task_comments for select to authenticated
using (public.can_view_task(task_id) and deleted_at is null);
create policy comments_insert on public.task_comments for insert to authenticated
with check (
  user_id = auth.uid() and public.can_view_task(task_id)
  and exists (
    select 1 from public.tasks t
    where t.id = task_id
      and public.has_project_role(t.project_id, array['admin','manager','member']::public.user_role[])
  )
);
create policy comments_update on public.task_comments for update to authenticated
using (
  (user_id = auth.uid() and deleted_at is null)
  or public.can_update_task(task_id)
)
with check (
  user_id = auth.uid() or public.can_update_task(task_id)
);

create policy attachments_select on public.task_attachments for select to authenticated
using (public.can_view_task(task_id) and deleted_at is null);
create policy attachments_insert on public.task_attachments for insert to authenticated
with check (uploaded_by = auth.uid() and public.can_update_task(task_id));
create policy attachments_update on public.task_attachments for update to authenticated
using (uploaded_by = auth.uid() or public.can_update_task(task_id))
with check (uploaded_by = auth.uid() or public.can_update_task(task_id));

create policy history_select on public.task_history for select to authenticated
using (public.can_view_task(task_id));

create policy milestones_select on public.project_milestones for select to authenticated
using (public.is_project_member(project_id));
create policy milestones_manage on public.project_milestones for all to authenticated
using (
  public.can_manage_project(project_id)
  or exists (select 1 from public.project_stages s where s.id = stage_id and public.has_project_role(s.project_id, array['manager']::public.user_role[]))
) with check (
  public.can_manage_project(project_id)
  or exists (select 1 from public.project_stages s where s.id = stage_id and public.has_project_role(s.project_id, array['manager']::public.user_role[]))
);
create policy task_milestones_select on public.task_milestones for select to authenticated
using (public.can_view_task(task_id));
create policy task_milestones_manage on public.task_milestones for all to authenticated
using (exists (select 1 from public.tasks t where t.id = task_id and public.can_update_task(t.id)))
with check (exists (select 1 from public.tasks t where t.id = task_id and public.can_update_task(t.id)));

create policy risks_select on public.project_risks for select to authenticated
using (public.is_project_member(project_id));
create policy risks_manage on public.project_risks for all to authenticated
using (public.can_manage_project(project_id) or public.has_project_role(project_id, array['manager']::public.user_role[]))
with check (public.can_manage_project(project_id) or public.has_project_role(project_id, array['manager']::public.user_role[]));

create policy evidence_categories_select on public.evidence_categories for select to authenticated
using (public.is_project_member(project_id));
create policy evidence_categories_manage on public.evidence_categories for all to authenticated
using (public.can_manage_project(project_id) or public.has_project_role(project_id, array['manager']::public.user_role[]))
with check (public.can_manage_project(project_id) or public.has_project_role(project_id, array['manager']::public.user_role[]));
create policy evidence_items_select on public.project_evidence_items for select to authenticated
using (public.is_project_member(project_id));
create policy evidence_items_manage on public.project_evidence_items for all to authenticated
using (public.can_manage_project(project_id) or public.has_project_role(project_id, array['manager']::public.user_role[]))
with check (public.can_manage_project(project_id) or public.has_project_role(project_id, array['manager']::public.user_role[]));

create policy invitations_select on public.invitations for select to authenticated
using (project_id is not null and public.can_manage_project(project_id));
create policy invitations_insert on public.invitations for insert to authenticated
with check (project_id is not null and public.can_manage_project(project_id) and invited_by = auth.uid());
create policy invitations_update on public.invitations for update to authenticated
using (project_id is not null and public.can_manage_project(project_id))
with check (project_id is not null and public.can_manage_project(project_id));

create policy notifications_select on public.notifications for select to authenticated
using (user_id = auth.uid() and public.is_active_user());
create policy notifications_update on public.notifications for update to authenticated
using (user_id = auth.uid() and public.is_active_user())
with check (user_id = auth.uid());

commit;
