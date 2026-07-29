begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'task-evidence',
  'task-evidence',
  false,
  52428800,
  array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy task_evidence_select
on storage.objects for select to authenticated
using (
  bucket_id = 'task-evidence'
  and array_length(storage.foldername(name), 1) >= 2
  and exists (
    select 1 from public.tasks t
    where t.id::text = (storage.foldername(name))[2]
      and t.project_id::text = (storage.foldername(name))[1]
      and public.can_view_task(t.id)
  )
);

create policy task_evidence_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'task-evidence'
  and array_length(storage.foldername(name), 1) = 2
  and storage.filename(name) ~ '^[0-9a-fA-F-]{36}-.+'
  and exists (
    select 1 from public.tasks t
    where t.id::text = (storage.foldername(name))[2]
      and t.project_id::text = (storage.foldername(name))[1]
      and public.can_update_task(t.id)
  )
);

create policy task_evidence_update
on storage.objects for update to authenticated
using (
  bucket_id = 'task-evidence'
  and owner_id = auth.uid()::text
  and exists (
    select 1 from public.tasks t
    where t.id::text = (storage.foldername(name))[2]
      and t.project_id::text = (storage.foldername(name))[1]
      and public.can_update_task(t.id)
  )
)
with check (
  bucket_id = 'task-evidence'
  and owner_id = auth.uid()::text
  and exists (
    select 1 from public.tasks t
    where t.id::text = (storage.foldername(name))[2]
      and t.project_id::text = (storage.foldername(name))[1]
      and public.can_update_task(t.id)
  )
);

create policy task_evidence_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'task-evidence'
  and exists (
    select 1 from public.tasks t
    where t.id::text = (storage.foldername(name))[2]
      and t.project_id::text = (storage.foldername(name))[1]
      and (
        owner_id = auth.uid()::text
        or public.can_manage_project(t.project_id)
        or (t.area_id is not null and public.can_manage_area(t.area_id))
      )
  )
);

commit;
