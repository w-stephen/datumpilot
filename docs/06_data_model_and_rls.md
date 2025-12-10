# DatumPilot – Data Model & RLS (v2.1)

## Document Info
- **Version**: 2.1
- **Last Updated**: December 2025
- **Status**: Approved

---

## 1) Entity List (responsibilities)
- **Users**: Supabase `auth.users` identity; owns all tenant data.
- **Projects**: user-scoped containers for FCF records, stack-up analyses, measurement runs, uploads; supports tags/search.
- **FCF Records**: canonical FCF JSON plus validation/calculation/AI metadata and explanation per project.
- **Stack-Up Analyses**: tolerance stack-up calculations with dimensions, methods (Worst-Case/RSS/Six Sigma), acceptance criteria, and results.
- **Measurement Runs**: stored inputs/results for calculators per FCF with pass/fail and unit context.
- **User Settings**: units, decimal precision, dual-display preferences per user.
- **Uploads**: metadata for private files (exports, future imports) linked to projects.

### What Changed from v2.0

| Original | Current |
|----------|---------|
| `parse_confidence` column in fcf_records | Removed (no image extraction) |
| `source_input_type` included 'image' | Now only 'builder' or 'json' |
| `fcf_interpretation_runs` table | Removed (extraction agent deprecated) |
| — | Added `stackup_analyses` table |
| Uploads included 'image','pdf' roles | Removed from v1 scope |

---

## 2) Table Design (Postgres, SQL-like)

### projects
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

### uploads
```sql
id uuid primary key default gen_random_uuid(),
project_id uuid not null references projects(id) on delete cascade,
created_by uuid not null references auth.users(id),
file_role text not null check (file_role in
  ('step','csv','export_png','export_svg','export_json')),
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

**Note**: `'image'` and `'pdf'` file roles removed from v1 scope (no Mode 1 image interpretation).

### fcf_records
```sql
id uuid primary key default gen_random_uuid(),
project_id uuid not null references projects(id) on delete cascade,
characteristic text not null check (characteristic in ('position','flatness','perpendicularity','profile','other')),
feature_type text,
source_unit text not null default 'mm' check (source_unit in ('mm','inch')),
standard text not null default 'ASME_Y14_5_2018',
name text not null,
source_input_type text not null check (source_input_type in ('builder','json')),
fcf_json jsonb not null,
validation_errors jsonb,
calc_summary jsonb,
explanation text,
confidence text check (confidence in ('high','medium','low')),
warnings text[],
created_by uuid not null references auth.users(id),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
deleted_at timestamptz,
unique (project_id, lower(name)),
index (project_id, created_at desc),
index (characteristic),
index gin (fcf_json)
```

**Removed columns**:
- `parse_confidence` - No longer applicable (no image extraction)
- `source_upload_id` - No image/PDF upload linking in v1

### stackup_analyses
```sql
id uuid primary key default gen_random_uuid(),
project_id uuid not null references projects(id) on delete cascade,
name text not null,
description text,
measurement_objective text not null,
acceptance_criteria jsonb not null default '{}',
  -- { min?: number, max?: number, maxTolerance?: number }
positive_direction text not null check (positive_direction in
  ('left-to-right', 'right-to-left', 'bottom-to-top', 'top-to-bottom')),
dimensions jsonb not null default '[]',
  -- Array of StackupDimension objects
analysis_method text not null check (analysis_method in
  ('worst-case', 'rss', 'six-sigma')),
unit text not null default 'mm' check (unit in ('mm', 'inch')),
result jsonb,
  -- StackupResult object (nullable until calculated)
notes text,
created_by uuid not null references auth.users(id),
created_at timestamptz not null default now(),
updated_at timestamptz not null default now(),
deleted_at timestamptz,
unique (project_id, lower(name)),
index (project_id, created_at desc),
index (analysis_method)
```

**JSONB Structures**:

```typescript
// dimensions array element
interface StackupDimension {
  id: string;           // UUID for UI ordering
  name: string;
  nominal: number;
  plusTolerance: number;
  minusTolerance: number;
  sign: '+' | '-';      // Contribution direction
  description?: string;
  sourceDrawing?: string;
  cp?: number;          // Process capability (Six Sigma)
}

// acceptance_criteria
interface AcceptanceCriteria {
  min?: number;
  max?: number;
  maxTolerance?: number;
}

// result (when calculated)
interface StackupResult {
  method: 'worst-case' | 'rss' | 'six-sigma';
  nominal: number;
  totalTolerance: number;
  min: number;
  max: number;
  standardDeviation?: number;     // RSS/Six Sigma only
  cpk?: number;                    // Six Sigma only
  contributions: Array<{
    dimensionId: string;
    name: string;
    percentage: number;
  }>;
  passesAcceptanceCriteria: boolean;
  calculatedAt: string;           // ISO timestamp
}
```

### measurements
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

### user_settings
```sql
user_id uuid primary key references auth.users(id) on delete cascade,
unit text not null default 'mm' check (unit in ('mm','inch')),
decimals smallint not null default 2 check (decimals between 1 and 4),
dual_display boolean not null default false,
updated_at timestamptz not null default now()
```

### project_quotas
```sql
project_id uuid primary key references projects(id) on delete cascade,
max_upload_bytes bigint not null default 104857600, -- 100MB default
max_upload_count int not null default 500,
max_fcf_records int not null default 2000,
max_measurements int not null default 5000,
max_stackup_analyses int not null default 500,
created_at timestamptz not null default now(),
updated_at timestamptz not null default now()
```

**Deprecated Table**: `fcf_interpretation_runs` - Removed. This table stored extraction agent runs for image interpretation (Mode 1), which is out of v1 scope.

---

## 3) Relationships (cardinality)
- One user → many projects (`projects.user_id`).
- One project → many FCF records (`fcf_records.project_id`).
- One project → many stack-up analyses (`stackup_analyses.project_id`).
- One project → many uploads (`uploads.project_id`).
- One FCF record → many measurement runs (`measurements.fcf_record_id`).
- One user → one settings row (`user_settings.user_id`).

```
┌─────────┐     ┌──────────────┐     ┌──────────────┐
│  User   │────<│   Projects   │────<│  FCF Records │────<│ Measurements │
└─────────┘     └──────────────┘     └──────────────┘     └──────────────┘
     │                 │
     │                 ├────<│ Stack-Up Analyses │
     │                 │
     │                 └────<│     Uploads       │
     │
     └─────────────────────<│  User Settings    │
```

---

## 4) RLS Strategy (multi-tenant)

### General Principles
- Enable RLS on all tables; default deny.
- Ensure helper indexes exist before enabling policies.
- Use paired `USING` and `WITH CHECK` clauses so inserts/updates cannot point to foreign keys outside the owner's project.
- Add `using index` hints in migrations to guarantee join performance.
- Canonical unit: store values in `mm` at ingestion; keep `source_unit`, `unit`, `conversion_notes`, `calculator_version` for reruns.

### Table Policies

**projects**
- Allow select/insert/update/delete where `auth.uid() = user_id`
- Insert sets `user_id` to `auth.uid()` via policy or trigger
- Updates set `updated_at = now()` via trigger
- Soft-delete writes `deleted_at`

**fcf_records**
- Allow when `exists(select 1 from projects p where p.id = project_id and p.user_id = auth.uid() and p.deleted_at is null)`
- `WITH CHECK` mirrors the same
- Trigger sets `created_by`/`updated_at` and prevents writes when parent is soft-deleted

**stackup_analyses**
- Allow when `exists(select 1 from projects p where p.id = project_id and p.user_id = auth.uid() and p.deleted_at is null)`
- `WITH CHECK` mirrors the same
- Trigger sets `created_by`/`updated_at` and prevents writes when parent is soft-deleted
- Quota enforcement via `project_quotas.max_stackup_analyses`

**measurements**
- Allow when `exists(select 1 from fcf_records f join projects p on p.id = f.project_id where f.id = fcf_record_id and p.user_id = auth.uid() and f.deleted_at is null and p.deleted_at is null)`
- Trigger prevents inserts when quota exceeded

**uploads**
- Allow when `exists(select 1 from projects p where p.id = project_id and p.user_id = auth.uid() and p.deleted_at is null)` and `storage_metadata ->> 'upload_id' = id`
- `WITH CHECK` requires the same
- Soft deletes set `status = 'deleted'`, `deleted_at = now()`

**user_settings**
- Allow where `user_id = auth.uid()`

**project_quotas**
- Owner-only via `auth.uid() = project_id.user_id` lookup

### Storage Policies
- Private buckets only; signed URLs
- Storage policies require object metadata `upload_id`, `project_id`, and `owner_user_id` that map to an `uploads` row owned by `auth.uid()`
- Service-role bypass only in controlled server actions with auditing

---

## 5) Migration Order

1. **Enums/Constraints**: Create enums or adopt text+check constraints (`file_role`, `source_input_type`, `confidence`, `calculator`, `analysis_method`, units); generate shared TS types from these definitions.

2. **Trigger Functions**: Create helper trigger functions for `touch_updated_at()` and soft-delete enforcement; create quota check functions per table.

3. **projects**: Create with indexes, `updated_at` trigger, soft-delete trigger, uniqueness on `lower(name)`; enable RLS + policies.

4. **project_quotas**: Create with defaults (including `max_stackup_analyses`) and RLS; attach quota enforcement triggers.

5. **uploads**: Create (depends on projects); enable RLS + policies; add `project_id` index and storage metadata contract.

6. **fcf_records**: Create (depends on projects); enable RLS + policies; add uniqueness on `lower(name)`; attach `updated_at` trigger.
   - **Note**: Remove `parse_confidence` and `source_upload_id` columns from any existing migration.

7. **stackup_analyses**: Create (depends on projects); enable RLS + policies; add uniqueness on `lower(name)`; attach `updated_at` trigger and quota enforcement.

8. **measurements**: Create (depends on fcf_records); enable RLS + policies; include versioning columns and `source_unit`/conversion notes.

9. **user_settings**: Create; enable RLS + policies.

10. **Storage Buckets**: Add storage bucket policies requiring metadata mapping; configure `exports` bucket.

11. **Testing**: Wrap each migration step in a transaction; add smoke tests (policy `EXPLAIN` plans, `set local role`, `auth.uid()` contexts) before promotion.

### Migration Files

| File | Description |
|------|-------------|
| `001_create_projects.sql` | Projects table with RLS |
| `002_create_uploads.sql` | Uploads table with RLS |
| `003_create_fcf_records.sql` | FCF records (no parse_confidence) |
| `004_create_measurements.sql` | Measurements table |
| `005_create_stackup_analyses.sql` | Stack-up analyses table |
| `006_create_user_settings.sql` | User settings table |
| `007_create_project_quotas.sql` | Quotas with stackup limit |

---

## 6) Index Strategy

### Primary Indexes (created automatically)
- Primary keys on all tables

### Foreign Key Indexes
- `projects.user_id`
- `fcf_records.project_id`
- `stackup_analyses.project_id`
- `measurements.fcf_record_id`
- `uploads.project_id`

### Query Pattern Indexes
- `(project_id, created_at desc)` on fcf_records, stackup_analyses, uploads - for listing
- `(fcf_record_id, created_at desc)` on measurements - for FCF detail view
- `gin(tags)` on projects - for tag search
- `gin(fcf_json)` on fcf_records - for JSONB queries

### RLS Performance Indexes
All foreign key columns used in RLS policy subqueries must be indexed to ensure policy evaluation is O(1) via index lookup.
