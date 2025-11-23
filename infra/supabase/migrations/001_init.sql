-- DatumPilot Supabase schema (v2) based on docs/06_data_model_and_rls.md and docs/08_database_review.md
-- This migration is intended to run on Supabase Postgres with RLS enabled.

create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- Helper to keep updated_at current on write.
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Soft-delete guard to prevent writes to deleted parents when enforced.
create or replace function public.prevent_mutation_when_deleted() returns trigger as $$
begin
  if new.deleted_at is not null then
    raise exception 'cannot modify soft-deleted row';
  end if;
  return new;
end;
$$ language plpgsql;

-- Quota enforcement stubs; implement limits as needed.
create or replace function public.enforce_project_quota_uploads() returns trigger as $$
begin
  -- TODO: implement quota checks using project_quotas for uploads.
  return new;
end;
$$ language plpgsql;

create or replace function public.enforce_project_quota_fcf() returns trigger as $$
begin
  -- TODO: implement quota checks using project_quotas for fcf_records and interpretation runs.
  return new;
end;
$$ language plpgsql;

create or replace function public.enforce_project_quota_measurements() returns trigger as $$
begin
  -- TODO: implement quota checks using project_quotas for measurements.
  return new;
end;
$$ language plpgsql;

-- Projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  description text,
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint projects_name_unique unique (user_id, lower(name))
);
create index projects_user_id_created_at_idx on public.projects (user_id, created_at desc);
create index projects_tags_gin_idx on public.projects using gin (tags);
create trigger projects_touch_updated_at before update on public.projects
  for each row execute function public.touch_updated_at();

alter table public.projects enable row level security;
create policy projects_owner_all on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Project quotas
create table public.project_quotas (
  project_id uuid primary key references public.projects(id) on delete cascade,
  max_upload_bytes bigint not null default 104857600,
  max_upload_count int not null default 500,
  max_fcf_records int not null default 2000,
  max_measurements int not null default 5000,
  max_interpretation_runs int not null default 3000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger project_quotas_touch_updated_at before update on public.project_quotas
  for each row execute function public.touch_updated_at();
alter table public.project_quotas enable row level security;
create policy project_quotas_owner_all on public.project_quotas
  for all using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid()
    )
  );

-- Uploads metadata (storage contract enforced via storage policies)
create table public.uploads (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  file_role text not null check (file_role in ('image','pdf','step','csv','export_png','export_svg','export_json')),
  storage_bucket text not null,
  storage_path text not null,
  file_name text not null,
  content_type text not null,
  file_size bigint not null check (file_size > 0),
  file_hash text,
  status text not null default 'stored' check (status in ('stored','failed','deleted')),
  metadata jsonb default '{}'::jsonb,
  storage_metadata jsonb default '{}'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint uploads_unique_object unique (storage_bucket, storage_path),
  constraint uploads_storage_contract check (
    (storage_metadata ->> 'upload_id')::uuid = id
    and storage_metadata ? 'project_id'
    and storage_metadata ? 'owner_user_id'
  )
);
create index uploads_project_id_created_at_idx on public.uploads (project_id, created_at desc);
create trigger uploads_enforce_quota before insert on public.uploads
  for each row execute function public.enforce_project_quota_uploads();
alter table public.uploads enable row level security;
create policy uploads_owner_all on public.uploads
  for all using (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid() and p.deleted_at is null
    )
    and storage_metadata ->> 'upload_id' = id::text
  ) with check (
    exists (
      select 1 from public.projects p
      where p.id = project_id and p.user_id = auth.uid() and p.deleted_at is null
    )
    and storage_metadata ->> 'upload_id' = id::text
  );

-- FCF records
create table public.fcf_records (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  characteristic text not null check (characteristic in ('position','flatness','perpendicularity','profile','other')),
  feature_type text,
  source_unit text not null default 'mm' check (source_unit in ('mm','inch')),
  standard text not null default 'ASME_Y14_5_2018',
  name text not null,
  source_input_type text not null check (source_input_type in ('image','builder','json')),
  fcf_json jsonb not null,
  parse_confidence numeric(5,4),
  validation_errors jsonb,
  calc_summary jsonb,
  explanation text,
  confidence text check (confidence in ('high','medium','low')),
  warnings text[],
  source_upload_id uuid references public.uploads(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint fcf_records_name_unique unique (project_id, lower(name))
);
create index fcf_records_project_id_created_at_idx on public.fcf_records (project_id, created_at desc);
create index fcf_records_characteristic_idx on public.fcf_records (characteristic);
create index fcf_records_json_gin_idx on public.fcf_records using gin (fcf_json);
create trigger fcf_records_touch_updated_at before update on public.fcf_records
  for each row execute function public.touch_updated_at();
create trigger fcf_records_enforce_quota before insert on public.fcf_records
  for each row execute function public.enforce_project_quota_fcf();
alter table public.fcf_records enable row level security;
create policy fcf_records_owner_all on public.fcf_records
  for all using (
    exists (
      select 1
      from public.projects p
      where p.id = project_id
        and p.user_id = auth.uid()
        and p.deleted_at is null
    )
  ) with check (
    exists (
      select 1
      from public.projects p
      where p.id = project_id
        and p.user_id = auth.uid()
        and p.deleted_at is null
    )
  );

-- Interpretation runs
create table public.fcf_interpretation_runs (
  id uuid primary key default gen_random_uuid(),
  fcf_record_id uuid not null references public.fcf_records(id) on delete cascade,
  run_type text not null check (run_type in ('initial','retry','manual_override')),
  parse_confidence numeric(5,4),
  qa_confidence text check (qa_confidence in ('high','medium','low')),
  extraction_json jsonb,
  combined_json jsonb,
  interpretation_json jsonb,
  qa_result jsonb,
  warnings text[],
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index fcf_interpretation_runs_record_idx on public.fcf_interpretation_runs (fcf_record_id, created_at desc);
create trigger fcf_interpretation_runs_enforce_quota before insert on public.fcf_interpretation_runs
  for each row execute function public.enforce_project_quota_fcf();
alter table public.fcf_interpretation_runs enable row level security;
create policy fcf_interpretation_runs_owner_all on public.fcf_interpretation_runs
  for all using (
    exists (
      select 1
      from public.fcf_records f
      join public.projects p on p.id = f.project_id
      where f.id = fcf_record_id
        and p.user_id = auth.uid()
        and f.deleted_at is null
        and p.deleted_at is null
    )
  ) with check (
    exists (
      select 1
      from public.fcf_records f
      join public.projects p on p.id = f.project_id
      where f.id = fcf_record_id
        and p.user_id = auth.uid()
        and f.deleted_at is null
        and p.deleted_at is null
    )
  );

-- Measurements
create table public.measurements (
  id uuid primary key default gen_random_uuid(),
  fcf_record_id uuid not null references public.fcf_records(id) on delete cascade,
  calculator text not null check (calculator in ('position_mmc','flatness','perpendicularity','profile')),
  calculator_version text not null,
  schema_version text,
  inputs_json jsonb not null,
  results_json jsonb not null,
  pass_fail boolean,
  unit text not null default 'mm' check (unit in ('mm','inch')),
  source_unit text not null default 'mm' check (source_unit in ('mm','inch')),
  decimals smallint check (decimals between 1 and 4),
  measurement_type text check (measurement_type in ('trial','final')),
  notes text,
  conversion_notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index measurements_record_idx on public.measurements (fcf_record_id, created_at desc);
create index measurements_calculator_idx on public.measurements (calculator);
create trigger measurements_enforce_quota before insert on public.measurements
  for each row execute function public.enforce_project_quota_measurements();
alter table public.measurements enable row level security;
create policy measurements_owner_all on public.measurements
  for all using (
    exists (
      select 1
      from public.fcf_records f
      join public.projects p on p.id = f.project_id
      where f.id = fcf_record_id
        and p.user_id = auth.uid()
        and f.deleted_at is null
        and p.deleted_at is null
    )
  ) with check (
    exists (
      select 1
      from public.fcf_records f
      join public.projects p on p.id = f.project_id
      where f.id = fcf_record_id
        and p.user_id = auth.uid()
        and f.deleted_at is null
        and p.deleted_at is null
    )
  );

-- User settings
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  unit text not null default 'mm' check (unit in ('mm','inch')),
  decimals smallint not null default 2 check (decimals between 1 and 4),
  dual_display boolean not null default false,
  updated_at timestamptz not null default now()
);
create trigger user_settings_touch_updated_at before update on public.user_settings
  for each row execute function public.touch_updated_at();
alter table public.user_settings enable row level security;
create policy user_settings_owner_all on public.user_settings
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Suggested storage bucket policies (apply via Supabase Storage config, not SQL):
-- Require object metadata to include upload_id, project_id, owner_user_id matching uploads table for private buckets.
