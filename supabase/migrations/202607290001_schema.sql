begin;

create extension if not exists pgcrypto with schema extensions;

create type public.user_role as enum ('admin', 'manager', 'member', 'viewer');
create type public.project_status as enum ('draft', 'active', 'completed', 'archived');
create type public.task_status as enum ('not_started', 'in_progress', 'waiting_external', 'blocked', 'under_review', 'completed', 'cancelled');
create type public.task_priority as enum ('critical', 'high', 'medium', 'low');
create type public.task_assignment_type as enum ('responsible', 'supporting', 'approver');
create type public.task_type as enum ('task', 'milestone', 'checkpoint', 'event_day', 'post_event');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');
create type public.risk_status as enum ('identified', 'monitoring', 'mitigated', 'occurred', 'closed');
create type public.risk_probability as enum ('low', 'medium', 'high');
create type public.risk_impact as enum ('low', 'medium', 'high', 'critical');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  avatar_url text,
  global_role public.user_role not null default 'member',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index profiles_email_lower_uidx on public.profiles (lower(email));

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null,
  name text not null,
  slug text unique not null,
  description text,
  event_date date,
  status public.project_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  access_level public.user_role not null default 'member',
  active boolean not null default true,
  invited_by uuid references public.profiles(id) on delete set null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table public.areas (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  responsible_user_id uuid references public.profiles(id) on delete set null,
  original_responsible_label text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, slug)
);

create table public.project_member_areas (
  id uuid primary key default gen_random_uuid(),
  project_member_id uuid not null references public.project_members(id) on delete cascade,
  area_id uuid not null references public.areas(id) on delete cascade,
  can_view boolean not null default true,
  can_manage boolean not null default false,
  created_at timestamptz not null default now(),
  unique (project_member_id, area_id)
);

create table public.project_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  number integer,
  name text not null,
  slug text not null,
  stage_type text not null check (stage_type in ('week', 'event_day', 'post_event', 'complementary')),
  start_date date,
  end_date date,
  original_period_label text,
  description text,
  sort_order integer not null default 0,
  source_key text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, slug),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  area_id uuid references public.areas(id) on delete set null,
  stage_id uuid references public.project_stages(id) on delete set null,
  title text not null,
  description text,
  task_type public.task_type not null default 'task',
  status public.task_status not null default 'not_started',
  priority public.task_priority not null default 'medium',
  original_area_label text,
  original_responsible_label text,
  original_status_label text,
  original_priority_label text,
  original_due_date_label text,
  primary_responsible_user_id uuid references public.profiles(id) on delete set null,
  approver_user_id uuid references public.profiles(id) on delete set null,
  start_date date,
  due_date date,
  blocked_reason text,
  evidence_required boolean not null default false,
  approval_required boolean not null default false,
  completion_percentage integer not null default 0 check (completion_percentage between 0 and 100),
  source_key text unique,
  source_page integer,
  source_section text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  approved_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status = 'blocked' or blocked_reason is null),
  check ((status = 'completed' and completed_at is not null) or (status <> 'completed' and completed_at is null))
);

create table public.task_assignees (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  assignment_type public.task_assignment_type not null,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (task_id, user_id, assignment_type)
);

create table public.task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  description text,
  required boolean not null default true,
  completed boolean not null default false,
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((completed and completed_at is not null) or (not completed and completed_at is null))
);

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete restrict,
  content text not null check (length(btrim(content)) > 0),
  comment_type text not null default 'comment' check (comment_type in ('comment', 'question', 'answer', 'update', 'blocker')),
  parent_comment_id uuid references public.task_comments(id) on delete set null,
  resolved boolean not null default false,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  check ((resolved and resolved_at is not null) or (not resolved and resolved_at is null))
);

create table public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  file_name text not null,
  storage_path text unique not null,
  mime_type text,
  file_size bigint check (file_size is null or file_size >= 0),
  description text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.task_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  field_name text,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  stage_id uuid references public.project_stages(id) on delete set null,
  title text not null,
  description text,
  milestone_date date,
  original_date_label text,
  priority public.task_priority not null default 'critical',
  status public.task_status not null default 'not_started',
  source_key text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.task_milestones (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  milestone_id uuid not null references public.project_milestones(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (task_id, milestone_id)
);

create table public.project_risks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  probability public.risk_probability,
  impact public.risk_impact,
  status public.risk_status not null default 'identified',
  mitigation_plan text,
  contingency_plan text,
  responsible_user_id uuid references public.profiles(id) on delete set null,
  original_responsible_label text,
  source_key text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.evidence_categories (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text,
  sort_order integer not null default 0,
  source_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_evidence_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  category_id uuid references public.evidence_categories(id) on delete set null,
  task_id uuid references public.tasks(id) on delete set null,
  milestone_id uuid references public.project_milestones(id) on delete set null,
  title text not null,
  description text,
  storage_path text,
  external_url text,
  responsible_user_id uuid references public.profiles(id) on delete set null,
  original_responsible_label text,
  due_date date,
  completed_at timestamptz,
  source_key text unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null,
  status public.invitation_status not null default 'pending',
  token_hash text,
  expires_at timestamptz,
  accepted_at timestamptz,
  invited_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index invitations_email_lower_idx on public.invitations (lower(email));

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  title text not null,
  message text not null,
  notification_type text not null default 'info',
  source_key text unique,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index project_members_user_project_idx on public.project_members (user_id, project_id);
create index project_members_project_idx on public.project_members (project_id);
create index project_member_areas_member_idx on public.project_member_areas (project_member_id);
create index project_member_areas_area_idx on public.project_member_areas (area_id);
create index tasks_project_idx on public.tasks (project_id);
create index tasks_stage_idx on public.tasks (stage_id);
create index tasks_area_idx on public.tasks (area_id);
create index tasks_status_idx on public.tasks (status);
create index tasks_due_date_idx on public.tasks (due_date);
create index tasks_primary_responsible_idx on public.tasks (primary_responsible_user_id);
create index tasks_archived_idx on public.tasks (archived_at);
create index task_assignees_task_idx on public.task_assignees (task_id);
create index task_assignees_user_idx on public.task_assignees (user_id);
create index task_checklist_items_task_idx on public.task_checklist_items (task_id);
create index task_comments_task_idx on public.task_comments (task_id);
create index task_history_task_created_idx on public.task_history (task_id, created_at desc);
create index notifications_user_read_idx on public.notifications (user_id, read_at);
create index project_risks_project_status_idx on public.project_risks (project_id, status);
create index project_evidence_project_category_idx on public.project_evidence_items (project_id, category_id);

commit;
