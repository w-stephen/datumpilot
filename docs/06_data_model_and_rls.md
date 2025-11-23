# DatumPilot – Data Model & RLS (v1)

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
  created_at timestamptz not null default now(),
  unique (storage_bucket, storage_path),
  index (project_id, created_at desc)
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
  index (fcf_record_id, created_at desc)
  ```

- `measurements`
  ```sql
  id uuid primary key default gen_random_uuid(),
  fcf_record_id uuid not null references fcf_records(id) on delete cascade,
  calculator text not null check (calculator in
    ('position_mmc','flatness','perpendicularity','profile')),
  inputs_json jsonb not null,
  results_json jsonb not null,
  pass_fail boolean,
  unit text not null default 'mm' check (unit in ('mm','inch')),
  decimals smallint check (decimals between 1 and 4),
  measurement_type text check (measurement_type in ('trial','final')),
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  index (fcf_record_id, created_at desc),
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

## 3) Relationships (cardinality)
- One user → many projects (`projects.user_id`).
- One project → many FCF records (`fcf_records.project_id`).
- One project → many uploads (`uploads.project_id`); optional link from FCF to source upload.
- One FCF record → many measurement runs (`measurements.fcf_record_id`).
- One FCF record → many interpretation runs (`fcf_interpretation_runs.fcf_record_id`).
- One user → one settings row (`user_settings.user_id`).

## 4) RLS Strategy (multi-tenant)
- Enable RLS on all tables; default deny.
- `projects`: allow select/insert/update/delete where `auth.uid() = user_id`; insert sets `user_id` to `auth.uid()` via policy or trigger.
- `fcf_records`: allow when `exists(select 1 from projects p where p.id = project_id and p.user_id = auth.uid())`; insert ensures `created_by = auth.uid()`.
- `measurements`: allow when `exists(select 1 from fcf_records f join projects p on p.id = f.project_id where f.id = fcf_record_id and p.user_id = auth.uid())`.
- `uploads`: allow when `exists(select 1 from projects p where p.id = project_id and p.user_id = auth.uid())`.
- `user_settings`: allow where `user_id = auth.uid()`.
- `fcf_interpretation_runs`: allow when `exists(select 1 from fcf_records f join projects p on p.id = f.project_id where f.id = fcf_record_id and p.user_id = auth.uid())`.
- Storage: private buckets only; signed URLs; storage policies mirror `uploads` by checking object metadata (e.g., `upload_id`) against a project owned by `auth.uid()`. Service-role bypass only in controlled server actions.
- Use paired `USING` and `WITH CHECK` clauses so inserts/updates cannot point to foreign keys outside the owner’s project. Add supporting indexes on join keys used in policies.
- Canonical unit: store values in `mm` at ingestion; convert on display and keep `source_unit`/`unit` columns explicit for clarity.

## 5) Migration Order
1. Create enums or adopt text+check constraints (`file_role`, `source_input_type`, `confidence`, `calculator`, units).
2. Create `projects` (with indexes and triggers for `updated_at` if desired); enable RLS + policies.
3. Create `uploads` (depends on projects); enable RLS + policies.
4. Create `fcf_records` (depends on projects, optional uploads); enable RLS + policies.
5. Create `fcf_interpretation_runs` (depends on fcf_records); enable RLS + policies.
6. Create `measurements` (depends on fcf_records); enable RLS + policies.
7. Create `user_settings`; enable RLS + policies.
8. Add supporting indexes, `updated_at` triggers, storage bucket policies, and any generated/triggered columns for promoted FCF fields.
