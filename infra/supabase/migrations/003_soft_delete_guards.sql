-- ============================================================================
-- Migration: 003_soft_delete_guards.sql
-- Purpose: Attach soft-delete mutation guards and cascade behaviors
-- ============================================================================

-- ============================================================================
-- GUARD: Prevent mutations on soft-deleted rows
-- This ensures deleted rows cannot be modified
-- ============================================================================

-- Already defined in 001_init.sql, but let's make it more robust
create or replace function public.prevent_mutation_when_deleted()
returns trigger as $$
begin
  -- On UPDATE: check if the row is already soft-deleted
  if tg_op = 'UPDATE' then
    -- Allow setting deleted_at (the soft-delete itself)
    if old.deleted_at is null and new.deleted_at is not null then
      return new;
    end if;

    -- Block updates to already deleted rows
    if old.deleted_at is not null then
      raise exception 'Cannot modify soft-deleted row'
        using errcode = 'P0003';
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- GUARD: Prevent inserts to soft-deleted parents
-- ============================================================================

create or replace function public.check_parent_not_deleted()
returns trigger as $$
declare
  v_parent_deleted boolean;
begin
  -- Check based on which table we're inserting into
  case tg_table_name
    when 'fcf_records' then
      select deleted_at is not null into v_parent_deleted
      from public.projects
      where id = new.project_id;

    when 'uploads' then
      select deleted_at is not null into v_parent_deleted
      from public.projects
      where id = new.project_id;

    when 'fcf_interpretation_runs' then
      select fr.deleted_at is not null or p.deleted_at is not null into v_parent_deleted
      from public.fcf_records fr
      join public.projects p on p.id = fr.project_id
      where fr.id = new.fcf_record_id;

    when 'measurements' then
      select fr.deleted_at is not null or p.deleted_at is not null into v_parent_deleted
      from public.fcf_records fr
      join public.projects p on p.id = fr.project_id
      where fr.id = new.fcf_record_id;

    else
      v_parent_deleted := false;
  end case;

  if v_parent_deleted then
    raise exception 'Cannot insert into soft-deleted parent'
      using errcode = 'P0004';
  end if;

  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- ATTACH TRIGGERS: Projects
-- ============================================================================

drop trigger if exists projects_prevent_mutation_when_deleted on public.projects;
create trigger projects_prevent_mutation_when_deleted
  before update on public.projects
  for each row
  execute function public.prevent_mutation_when_deleted();

-- ============================================================================
-- ATTACH TRIGGERS: FCF Records
-- ============================================================================

drop trigger if exists fcf_records_prevent_mutation_when_deleted on public.fcf_records;
create trigger fcf_records_prevent_mutation_when_deleted
  before update on public.fcf_records
  for each row
  execute function public.prevent_mutation_when_deleted();

drop trigger if exists fcf_records_check_parent on public.fcf_records;
create trigger fcf_records_check_parent
  before insert on public.fcf_records
  for each row
  execute function public.check_parent_not_deleted();

-- ============================================================================
-- ATTACH TRIGGERS: Uploads
-- ============================================================================

drop trigger if exists uploads_prevent_mutation_when_deleted on public.uploads;
create trigger uploads_prevent_mutation_when_deleted
  before update on public.uploads
  for each row
  execute function public.prevent_mutation_when_deleted();

drop trigger if exists uploads_check_parent on public.uploads;
create trigger uploads_check_parent
  before insert on public.uploads
  for each row
  execute function public.check_parent_not_deleted();

-- ============================================================================
-- ATTACH TRIGGERS: FCF Interpretation Runs
-- ============================================================================

drop trigger if exists fcf_interpretation_runs_check_parent on public.fcf_interpretation_runs;
create trigger fcf_interpretation_runs_check_parent
  before insert on public.fcf_interpretation_runs
  for each row
  execute function public.check_parent_not_deleted();

-- ============================================================================
-- ATTACH TRIGGERS: Measurements
-- ============================================================================

drop trigger if exists measurements_check_parent on public.measurements;
create trigger measurements_check_parent
  before insert on public.measurements
  for each row
  execute function public.check_parent_not_deleted();

-- ============================================================================
-- CASCADE SOFT DELETE: When a project is soft-deleted, cascade to children
-- ============================================================================

create or replace function public.cascade_project_soft_delete()
returns trigger as $$
begin
  -- Only cascade when deleted_at is being set (not unset)
  if old.deleted_at is null and new.deleted_at is not null then
    -- Soft delete all FCF records
    update public.fcf_records
    set deleted_at = new.deleted_at
    where project_id = new.id
      and deleted_at is null;

    -- Soft delete all uploads
    update public.uploads
    set deleted_at = new.deleted_at,
        status = 'deleted'
    where project_id = new.id
      and deleted_at is null;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists projects_cascade_soft_delete on public.projects;
create trigger projects_cascade_soft_delete
  after update of deleted_at on public.projects
  for each row
  when (old.deleted_at is null and new.deleted_at is not null)
  execute function public.cascade_project_soft_delete();

-- ============================================================================
-- SET created_by ON INSERT
-- Ensures created_by is always set to the current user
-- ============================================================================

create or replace function public.set_created_by()
returns trigger as $$
begin
  -- Only set if not already set or if different from auth.uid()
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;

  -- Validate that created_by matches the authenticated user
  -- (prevents users from impersonating others)
  if new.created_by != auth.uid() and auth.uid() is not null then
    raise exception 'created_by must match authenticated user'
      using errcode = 'P0005';
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Attach to relevant tables
drop trigger if exists fcf_records_set_created_by on public.fcf_records;
create trigger fcf_records_set_created_by
  before insert on public.fcf_records
  for each row
  execute function public.set_created_by();

drop trigger if exists uploads_set_created_by on public.uploads;
create trigger uploads_set_created_by
  before insert on public.uploads
  for each row
  execute function public.set_created_by();

drop trigger if exists fcf_interpretation_runs_set_created_by on public.fcf_interpretation_runs;
create trigger fcf_interpretation_runs_set_created_by
  before insert on public.fcf_interpretation_runs
  for each row
  execute function public.set_created_by();

drop trigger if exists measurements_set_created_by on public.measurements;
create trigger measurements_set_created_by
  before insert on public.measurements
  for each row
  execute function public.set_created_by();

-- ============================================================================
-- COMMENTS
-- ============================================================================

comment on function public.prevent_mutation_when_deleted() is
  'Prevents modifications to soft-deleted rows, except for the soft-delete itself.';

comment on function public.check_parent_not_deleted() is
  'Prevents inserts into tables where the parent record is soft-deleted.';

comment on function public.cascade_project_soft_delete() is
  'Cascades soft-delete from projects to fcf_records and uploads.';

comment on function public.set_created_by() is
  'Sets and validates created_by field matches the authenticated user.';
