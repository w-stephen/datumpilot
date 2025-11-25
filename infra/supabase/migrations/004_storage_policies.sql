-- ============================================================================
-- Migration: 004_storage_policies.sql
-- Purpose: Configure Supabase Storage bucket policies
--
-- IMPORTANT: Storage policies are typically configured via the Supabase
-- dashboard or CLI, not directly in SQL. This file documents the required
-- policies and provides SQL-based helpers for validation.
--
-- To apply these policies:
-- 1. Go to Supabase Dashboard > Storage > Policies
-- 2. Create the policies as documented below
-- OR
-- 3. Use the Supabase CLI: supabase storage policies create
-- ============================================================================

-- ============================================================================
-- BUCKET SETUP
-- Run this in the Supabase SQL Editor or via migrations
-- ============================================================================

-- Create the uploads bucket if it doesn't exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'uploads',
  'uploads',
  false,  -- Private bucket
  104857600,  -- 100MB file size limit
  array[
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'image/svg+xml',
    'application/pdf',
    'application/step',
    'application/octet-stream',
    'text/csv',
    'application/csv',
    'application/json'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = 104857600;

-- ============================================================================
-- STORAGE POLICY DOCUMENTATION
-- These policies should be created via Dashboard or CLI
-- ============================================================================

/*
POLICY 1: Upload Access (SELECT)
--------------------------------
Name: uploads_select_own
Target: uploads bucket
Operation: SELECT
Definition:
  - User must be authenticated
  - Object path must match: projects/{project_id}/uploads/{upload_id}/*
  - User must own the project

SQL Expression (for reference):
  auth.uid() = (
    select p.user_id
    from public.projects p
    join public.uploads u on u.project_id = p.id
    where u.storage_path = storage.foldername(name)
      and p.deleted_at is null
  )

POLICY 2: Upload Insert (INSERT)
--------------------------------
Name: uploads_insert_own
Target: uploads bucket
Operation: INSERT
Definition:
  - User must be authenticated
  - Object metadata must contain: upload_id, project_id, owner_user_id
  - owner_user_id in metadata must match auth.uid()
  - project must exist and be owned by user

SQL Expression (for reference):
  auth.uid() = (storage.foldername(name)::jsonb ->> 'owner_user_id')::uuid
  AND EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = (storage.foldername(name)::jsonb ->> 'project_id')::uuid
      AND p.user_id = auth.uid()
      AND p.deleted_at IS NULL
  )

POLICY 3: Upload Update (UPDATE)
--------------------------------
Name: uploads_update_own
Target: uploads bucket
Operation: UPDATE
Definition:
  - User must be authenticated
  - User must own the project associated with the upload

POLICY 4: Upload Delete (DELETE)
--------------------------------
Name: uploads_delete_own
Target: uploads bucket
Operation: DELETE
Definition:
  - User must be authenticated
  - User must own the project associated with the upload
*/

-- ============================================================================
-- HELPER FUNCTION: Validate storage metadata contract
-- Use this in RLS policies or application code
-- ============================================================================

create or replace function public.validate_storage_upload(
  p_bucket text,
  p_path text,
  p_metadata jsonb
) returns boolean as $$
declare
  v_upload_id uuid;
  v_project_id uuid;
  v_owner_user_id uuid;
  v_valid boolean := false;
begin
  -- Extract required fields from metadata
  v_upload_id := (p_metadata ->> 'upload_id')::uuid;
  v_project_id := (p_metadata ->> 'project_id')::uuid;
  v_owner_user_id := (p_metadata ->> 'owner_user_id')::uuid;

  -- All fields must be present
  if v_upload_id is null or v_project_id is null or v_owner_user_id is null then
    return false;
  end if;

  -- Validate that upload record exists and matches
  select true into v_valid
  from public.uploads u
  join public.projects p on p.id = u.project_id
  where u.id = v_upload_id
    and u.project_id = v_project_id
    and p.user_id = v_owner_user_id
    and u.storage_bucket = p_bucket
    and u.storage_path = p_path
    and u.deleted_at is null
    and p.deleted_at is null;

  return coalesce(v_valid, false);
end;
$$ language plpgsql stable security definer;

-- ============================================================================
-- HELPER FUNCTION: Extract project_id from storage path
-- Path format: projects/{project_id}/uploads/{upload_id}/{filename}
-- ============================================================================

create or replace function public.extract_project_id_from_path(p_path text)
returns uuid as $$
declare
  v_parts text[];
begin
  v_parts := string_to_array(p_path, '/');

  -- Validate path structure
  if array_length(v_parts, 1) < 4 then
    return null;
  end if;

  if v_parts[1] != 'projects' or v_parts[3] != 'uploads' then
    return null;
  end if;

  -- Return project_id (second element)
  begin
    return v_parts[2]::uuid;
  exception when others then
    return null;
  end;
end;
$$ language plpgsql immutable;

-- ============================================================================
-- HELPER FUNCTION: Check if user can access storage path
-- ============================================================================

create or replace function public.can_access_storage_path(
  p_user_id uuid,
  p_path text
) returns boolean as $$
declare
  v_project_id uuid;
begin
  -- Extract project_id from path
  v_project_id := public.extract_project_id_from_path(p_path);

  if v_project_id is null then
    return false;
  end if;

  -- Check if user owns the project
  return exists (
    select 1
    from public.projects p
    where p.id = v_project_id
      and p.user_id = p_user_id
      and p.deleted_at is null
  );
end;
$$ language plpgsql stable security definer;

-- ============================================================================
-- STORAGE RLS POLICIES (Alternative approach using SQL)
-- These can be applied if using storage schema directly
-- ============================================================================

-- Note: These policies work with the storage.objects table
-- Supabase uses this table internally for storage

-- Enable RLS on storage.objects if not already enabled
-- alter table storage.objects enable row level security;

-- Policy: Select own uploads
-- create policy "Users can view own uploads"
-- on storage.objects for select
-- using (
--   bucket_id = 'uploads'
--   and public.can_access_storage_path(auth.uid(), name)
-- );

-- Policy: Insert to own projects
-- create policy "Users can upload to own projects"
-- on storage.objects for insert
-- with check (
--   bucket_id = 'uploads'
--   and public.can_access_storage_path(auth.uid(), name)
-- );

-- Policy: Delete own uploads
-- create policy "Users can delete own uploads"
-- on storage.objects for delete
-- using (
--   bucket_id = 'uploads'
--   and public.can_access_storage_path(auth.uid(), name)
-- );

-- ============================================================================
-- COMMENTS
-- ============================================================================

comment on function public.validate_storage_upload(text, text, jsonb) is
  'Validates that storage upload metadata matches the uploads table record.';

comment on function public.extract_project_id_from_path(text) is
  'Extracts project_id from a storage path. Returns NULL if path is invalid.';

comment on function public.can_access_storage_path(uuid, text) is
  'Checks if a user can access a storage path based on project ownership.';
