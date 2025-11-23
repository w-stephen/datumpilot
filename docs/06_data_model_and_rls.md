# DatumPilot – Data Model & RLS (v2)

## 1) Entity List (responsibilities)
- **Users**: Supabase `auth.users` identity; owns all tenant data.
- **Projects**: user-scoped containers for FCF records, measurement runs, uploads; supports tags/search.
- **FCF Records**: canonical FCF JSON plus validation/calculation/AI metadata and explanation per project.
- **Measurement Runs**: stored inputs/results for calculators per FCF with pass/fail and unit context.
- **User Settings**: units, decimal precision, dual-display preferences per user.
- **Uploads**: metadata for private files (images/PDFs, STEP/CSV, exports) linked to projects.

## 2) Table Design (Postgres, SQL-like)
- `projects`
  ```sql
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null,
  description text,
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (user_id, lower(name)),
  index (user_id, created_at desc),
  index gin (tags)
  ```

- `uploads`
  ```sql
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  file_role text not null check (file_role in
    ('image','pdf','step','csv','export_png','export_svg','export_json')),
  storage_bucket text not null,
  storage_path text not null,
  file_name text not null,
  content_type text not null,
  file_size bigint not null check (file_size > 0),
  file_hash text,
  status text not null default 'stored' check (status in ('stored','failed','deleted')),
  metadata jsonb default '{}'::jsonb,
  storage_metadata jsonb default '{}'::jsonb, -- mirrored object metadata (must contain upload_id)
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (storage_bucket, storage_path),
  index (project_id, created_at desc),
  index (project_id)
  ```

- `fcf_records`
  ```sql
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
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
  source_upload_id uuid references uploads(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (project_id, lower(name)),
  index (project_id, created_at desc),
  index (characteristic),
  index gin (fcf_json)
  ```

- `fcf_interpretation_runs`
  ```sql
  id uuid primary key default gen_random_uuid(),
  fcf_record_id uuid not null references fcf_records(id) on delete cascade,
  run_type text not null check (run_type in ('initial','retry','manual_override')),
  parse_confidence numeric(5,4),
  qa_confidence text check (qa_confidence in ('high','medium','low')),
  extraction_json jsonb,
  combined_json jsonb,
  interpretation_json jsonb,
  qa_result jsonb,
  warnings text[],
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  index (fcf_record_id, created_at desc),
  index (fcf_record_id)
  ```

- `measurements`
  ```sql
  id uuid primary key default gen_random_uuid(),
  fcf_record_id uuid not null references fcf_records(id) on delete cascade,
  calculator text not null check (calculator in
    ('position_mmc','flatness','perpendicularity','profile')),
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
  created_at timestamptz not null default now(),
  index (fcf_record_id, created_at desc),
  index (fcf_record_id),
  index (calculator)
  ```

- `user_settings`
  ```sql
  user_id uuid primary key references auth.users(id) on delete cascade,
  unit text not null default 'mm' check (unit in ('mm','inch')),
  decimals smallint not null default 2 check (decimals between 1 and 4),
  dual_display boolean not null default false,
  updated_at timestamptz not null default now()
  ```

- `project_quotas`
  ```sql
  project_id uuid primary key references projects(id) on delete cascade,
  max_upload_bytes bigint not null default 104857600, -- 100MB default
  max_upload_count int not null default 500,
  max_fcf_records int not null default 2000,
  max_measurements int not null default 5000,
  max_interpretation_runs int not null default 3000,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
  ```

## 3) Relationships (cardinality)
- One user → many projects (`projects.user_id`).
- One project → many FCF records (`fcf_records.project_id`).
- One project → many uploads (`uploads.project_id`); optional link from FCF to source upload.
- One FCF record → many measurement runs (`measurements.fcf_record_id`).
- One FCF record → many interpretation runs (`fcf_interpretation_runs.fcf_record_id`).
- One user → one settings row (`user_settings.user_id`).

## 4) RLS Strategy (multi-tenant)
- Enable RLS on all tables; default deny; ensure helper indexes (`projects.user_id`, `fcf_records.project_id`, `measurements.fcf_record_id`, `fcf_interpretation_runs.fcf_record_id`, `uploads.project_id`) exist before enabling policies.
- `projects`: allow select/insert/update/delete where `auth.uid() = user_id`; insert sets `user_id` to `auth.uid()` via policy or trigger. Updates set `updated_at = now()` via trigger; soft-delete writes `deleted_at`.
- `fcf_records`: allow when `exists(select 1 from projects p where p.id = project_id and p.user_id = auth.uid() and p.deleted_at is null)`; `WITH CHECK` mirrors the same. Trigger sets `created_by`/`updated_at` and prevents writes when parent is soft-deleted.
- `measurements`: allow when `exists(select 1 from fcf_records f join projects p on p.id = f.project_id where f.id = fcf_record_id and p.user_id = auth.uid() and f.deleted_at is null and p.deleted_at is null)`; trigger prevents inserts when quota exceeded (see `project_quotas`).
- `uploads`: allow when `exists(select 1 from projects p where p.id = project_id and p.user_id = auth.uid() and p.deleted_at is null)` and `storage_metadata ->> 'upload_id' = id`; `WITH CHECK` requires the same. Soft deletes set `status = 'deleted'`, `deleted_at = now()`.
- `user_settings`: allow where `user_id = auth.uid()`.
- `fcf_interpretation_runs`: allow when `exists(select 1 from fcf_records f join projects p on p.id = f.project_id where f.id = fcf_record_id and p.user_id = auth.uid() and f.deleted_at is null and p.deleted_at is null)`; trigger enforces quotas and stamps `created_by`.
- `project_quotas`: owner-only via `auth.uid() = project_id.user_id` lookup.
- Storage: private buckets only; signed URLs; storage policies require object metadata `upload_id`, `project_id`, and `owner_user_id` that map to an `uploads` row owned by `auth.uid()`. Service-role bypass only in controlled server actions with auditing.
- Use paired `USING` and `WITH CHECK` clauses so inserts/updates cannot point to foreign keys outside the owner’s project. Add `using index` hints in migrations to guarantee join performance.
- Canonical unit: store values in `mm` at ingestion; keep `source_unit`, `unit`, `conversion_notes`, `calculator_version`, and optional `schema_version` to make reruns reproducible.

## 5) Migration Order
1. Create enums or adopt text+check constraints (`file_role`, `source_input_type`, `confidence`, `calculator`, units); generate shared TS types from these definitions.
2. Create helper trigger functions for `touch_updated_at()` and soft-delete enforcement; create quota check functions per table.
3. Create `projects` (with indexes, `updated_at` trigger, soft-delete trigger, uniqueness on `lower(name)`); enable RLS + policies.
4. Create `project_quotas` with defaults and RLS; attach quota enforcement triggers to `uploads`, `fcf_records`, `fcf_interpretation_runs`, and `measurements`.
5. Create `uploads` (depends on projects); enable RLS + policies; add `project_id` index and storage metadata contract (`upload_id`, `project_id`, `owner_user_id`).
6. Create `fcf_records` (depends on projects, optional uploads); enable RLS + policies; add uniqueness on `lower(name)`; attach `updated_at` trigger.
7. Create `fcf_interpretation_runs` (depends on fcf_records); enable RLS + policies; ensure supporting index on `fcf_record_id`.
8. Create `measurements` (depends on fcf_records); enable RLS + policies; include versioning columns and `source_unit`/conversion notes; ensure `fcf_record_id` index.
9. Create `user_settings`; enable RLS + policies.
10. Add storage bucket policies requiring metadata mapping; add generated/triggered columns for promoted FCF fields as needed.
11. Wrap each migration step in a transaction; add smoke tests (policy `EXPLAIN` plans, `set local role`, `auth.uid()` contexts) before promotion.
