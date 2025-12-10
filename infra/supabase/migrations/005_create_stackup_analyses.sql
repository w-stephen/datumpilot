-- Migration: 005_create_stackup_analyses
-- Description: Add tolerance stack-up analysis table for Worst-Case, RSS, and Six Sigma methods

-- Stackup analyses
create table public.stackup_analyses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text,
  measurement_objective text not null,
  acceptance_criteria jsonb not null default '{}'::jsonb,
  positive_direction text not null check (
    positive_direction in ('left-to-right', 'right-to-left', 'bottom-to-top', 'top-to-bottom')
  ),
  dimensions jsonb not null default '[]'::jsonb,
  analysis_method text not null check (
    analysis_method in ('worst-case', 'rss', 'six-sigma')
  ),
  unit text not null default 'mm' check (unit in ('mm', 'inch')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,

  -- Unique name within project (case-insensitive, soft-delete aware)
  constraint stackup_analyses_name_unique unique nulls not distinct (project_id, lower(name), deleted_at)
);

comment on table public.stackup_analyses is
  'Tolerance stack-up analyses using Worst-Case, RSS, or Six Sigma methods';
comment on column public.stackup_analyses.acceptance_criteria is
  'JSONB with optional "minimum" and "maximum" numeric fields for pass/fail criteria';
comment on column public.stackup_analyses.dimensions is
  'Array of dimension objects with id, name, nominal, tolerancePlus, toleranceMinus, sign, etc.';
comment on column public.stackup_analyses.positive_direction is
  'Reference direction for sign convention in the stack-up diagram';

-- Indexes
create index stackup_analyses_project_id_created_at_idx
  on public.stackup_analyses (project_id, created_at desc);
create index stackup_analyses_method_idx
  on public.stackup_analyses (analysis_method);
create index stackup_analyses_dimensions_gin_idx
  on public.stackup_analyses using gin (dimensions);

-- Updated_at trigger (reuses existing function from 001_init.sql)
create trigger stackup_analyses_touch_updated_at
  before update on public.stackup_analyses
  for each row execute function public.touch_updated_at();

-- Row Level Security
alter table public.stackup_analyses enable row level security;

-- Select policy: user can see analyses in their projects
create policy stackup_analyses_select on public.stackup_analyses
  for select
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.user_id = auth.uid()
        and p.deleted_at is null
    )
  );

-- Insert policy: user can create analyses in their projects
create policy stackup_analyses_insert on public.stackup_analyses
  for insert
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.user_id = auth.uid()
        and p.deleted_at is null
    )
    and created_by = auth.uid()
  );

-- Update policy: user can update analyses in their projects
create policy stackup_analyses_update on public.stackup_analyses
  for update
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.user_id = auth.uid()
        and p.deleted_at is null
    )
  )
  with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.user_id = auth.uid()
        and p.deleted_at is null
    )
  );

-- Delete policy: user can delete analyses in their projects
create policy stackup_analyses_delete on public.stackup_analyses
  for delete
  using (
    exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.user_id = auth.uid()
        and p.deleted_at is null
    )
  );

-- Add stackup quota to project_quotas table
alter table public.project_quotas
  add column if not exists max_stackup_analyses int not null default 100;

comment on column public.project_quotas.max_stackup_analyses is
  'Maximum number of stack-up analyses allowed per project';

-- Quota enforcement function for stackup analyses
create or replace function public.enforce_project_quota_stackup() returns trigger as $$
declare
  current_count int;
  max_allowed int;
begin
  select count(*) into current_count
  from public.stackup_analyses
  where project_id = new.project_id and deleted_at is null;

  select coalesce(max_stackup_analyses, 100) into max_allowed
  from public.project_quotas
  where project_id = new.project_id;

  if current_count >= max_allowed then
    raise exception 'Stack-up analysis quota exceeded for project %', new.project_id;
  end if;

  return new;
end;
$$ language plpgsql;

-- Quota enforcement trigger
create trigger stackup_analyses_enforce_quota
  before insert on public.stackup_analyses
  for each row execute function public.enforce_project_quota_stackup();
