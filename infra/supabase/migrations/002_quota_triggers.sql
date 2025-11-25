-- ============================================================================
-- Migration: 002_quota_triggers.sql
-- Purpose: Implement quota enforcement triggers for all tracked resources
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: Get project quota limits
-- ============================================================================

create or replace function public.get_project_quota(p_project_id uuid)
returns table (
  max_upload_bytes bigint,
  max_upload_count int,
  max_fcf_records int,
  max_measurements int,
  max_interpretation_runs int
) as $$
begin
  return query
  select
    pq.max_upload_bytes,
    pq.max_upload_count,
    pq.max_fcf_records,
    pq.max_measurements,
    pq.max_interpretation_runs
  from public.project_quotas pq
  where pq.project_id = p_project_id;

  -- If no quota row exists, return defaults
  if not found then
    return query
    select
      104857600::bigint as max_upload_bytes,  -- 100MB
      500::int as max_upload_count,
      2000::int as max_fcf_records,
      5000::int as max_measurements,
      3000::int as max_interpretation_runs;
  end if;
end;
$$ language plpgsql stable;

-- ============================================================================
-- QUOTA ENFORCEMENT: Uploads
-- ============================================================================

create or replace function public.enforce_project_quota_uploads()
returns trigger as $$
declare
  v_quota record;
  v_current_count int;
  v_current_bytes bigint;
begin
  -- Get quota limits
  select * into v_quota from public.get_project_quota(new.project_id);

  -- Count current uploads (excluding deleted and failed)
  select
    count(*),
    coalesce(sum(file_size), 0)
  into v_current_count, v_current_bytes
  from public.uploads
  where project_id = new.project_id
    and status = 'stored'
    and deleted_at is null;

  -- Check upload count quota
  if v_current_count >= v_quota.max_upload_count then
    raise exception 'Upload count quota exceeded. Limit: %, Current: %',
      v_quota.max_upload_count, v_current_count
      using errcode = 'P0001';
  end if;

  -- Check total bytes quota
  if (v_current_bytes + new.file_size) > v_quota.max_upload_bytes then
    raise exception 'Upload storage quota exceeded. Limit: % bytes, Current: % bytes, Attempted: % bytes',
      v_quota.max_upload_bytes, v_current_bytes, new.file_size
      using errcode = 'P0001';
  end if;

  return new;
end;
$$ language plpgsql;

-- Drop and recreate the trigger
drop trigger if exists uploads_enforce_quota on public.uploads;
create trigger uploads_enforce_quota
  before insert on public.uploads
  for each row
  execute function public.enforce_project_quota_uploads();

-- ============================================================================
-- QUOTA ENFORCEMENT: FCF Records
-- ============================================================================

create or replace function public.enforce_project_quota_fcf()
returns trigger as $$
declare
  v_quota record;
  v_current_count int;
begin
  -- Get quota limits
  select * into v_quota from public.get_project_quota(new.project_id);

  -- Count current FCF records (excluding soft-deleted)
  select count(*) into v_current_count
  from public.fcf_records
  where project_id = new.project_id
    and deleted_at is null;

  -- Check quota
  if v_current_count >= v_quota.max_fcf_records then
    raise exception 'FCF record quota exceeded. Limit: %, Current: %',
      v_quota.max_fcf_records, v_current_count
      using errcode = 'P0001';
  end if;

  return new;
end;
$$ language plpgsql;

-- Drop and recreate the trigger
drop trigger if exists fcf_records_enforce_quota on public.fcf_records;
create trigger fcf_records_enforce_quota
  before insert on public.fcf_records
  for each row
  execute function public.enforce_project_quota_fcf();

-- ============================================================================
-- QUOTA ENFORCEMENT: FCF Interpretation Runs
-- ============================================================================

create or replace function public.enforce_project_quota_interpretation_runs()
returns trigger as $$
declare
  v_project_id uuid;
  v_quota record;
  v_current_count int;
begin
  -- Get project_id from fcf_record
  select project_id into v_project_id
  from public.fcf_records
  where id = new.fcf_record_id;

  if v_project_id is null then
    raise exception 'FCF record not found: %', new.fcf_record_id
      using errcode = 'P0002';
  end if;

  -- Get quota limits
  select * into v_quota from public.get_project_quota(v_project_id);

  -- Count current interpretation runs for the project
  select count(*) into v_current_count
  from public.fcf_interpretation_runs ir
  join public.fcf_records fr on fr.id = ir.fcf_record_id
  where fr.project_id = v_project_id
    and fr.deleted_at is null;

  -- Check quota
  if v_current_count >= v_quota.max_interpretation_runs then
    raise exception 'Interpretation run quota exceeded. Limit: %, Current: %',
      v_quota.max_interpretation_runs, v_current_count
      using errcode = 'P0001';
  end if;

  return new;
end;
$$ language plpgsql;

-- Drop and recreate the trigger
drop trigger if exists fcf_interpretation_runs_enforce_quota on public.fcf_interpretation_runs;
create trigger fcf_interpretation_runs_enforce_quota
  before insert on public.fcf_interpretation_runs
  for each row
  execute function public.enforce_project_quota_interpretation_runs();

-- ============================================================================
-- QUOTA ENFORCEMENT: Measurements
-- ============================================================================

create or replace function public.enforce_project_quota_measurements()
returns trigger as $$
declare
  v_project_id uuid;
  v_quota record;
  v_current_count int;
begin
  -- Get project_id from fcf_record
  select project_id into v_project_id
  from public.fcf_records
  where id = new.fcf_record_id;

  if v_project_id is null then
    raise exception 'FCF record not found: %', new.fcf_record_id
      using errcode = 'P0002';
  end if;

  -- Get quota limits
  select * into v_quota from public.get_project_quota(v_project_id);

  -- Count current measurements for the project
  select count(*) into v_current_count
  from public.measurements m
  join public.fcf_records fr on fr.id = m.fcf_record_id
  where fr.project_id = v_project_id
    and fr.deleted_at is null;

  -- Check quota
  if v_current_count >= v_quota.max_measurements then
    raise exception 'Measurement quota exceeded. Limit: %, Current: %',
      v_quota.max_measurements, v_current_count
      using errcode = 'P0001';
  end if;

  return new;
end;
$$ language plpgsql;

-- Drop and recreate the trigger
drop trigger if exists measurements_enforce_quota on public.measurements;
create trigger measurements_enforce_quota
  before insert on public.measurements
  for each row
  execute function public.enforce_project_quota_measurements();

-- ============================================================================
-- AUTO-CREATE PROJECT QUOTAS
-- Creates a quota row when a new project is created
-- ============================================================================

create or replace function public.create_default_project_quota()
returns trigger as $$
begin
  insert into public.project_quotas (project_id)
  values (new.id)
  on conflict (project_id) do nothing;

  return new;
end;
$$ language plpgsql;

drop trigger if exists projects_create_quota on public.projects;
create trigger projects_create_quota
  after insert on public.projects
  for each row
  execute function public.create_default_project_quota();

-- ============================================================================
-- COMMENTS
-- ============================================================================

comment on function public.get_project_quota(uuid) is
  'Returns quota limits for a project. Falls back to defaults if no quota row exists.';

comment on function public.enforce_project_quota_uploads() is
  'Trigger function that enforces upload count and storage size quotas.';

comment on function public.enforce_project_quota_fcf() is
  'Trigger function that enforces FCF record count quota.';

comment on function public.enforce_project_quota_interpretation_runs() is
  'Trigger function that enforces interpretation run count quota.';

comment on function public.enforce_project_quota_measurements() is
  'Trigger function that enforces measurement count quota.';

comment on function public.create_default_project_quota() is
  'Automatically creates a project_quotas row with defaults when a project is created.';
