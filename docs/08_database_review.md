# Database Review – DatumPilot (Supabase/Postgres)

## Summary
- Schema coverage is strong for core entities (projects, FCF records, measurements, interpretation runs, uploads, user settings) with clear foreign keys and check constraints.
- RLS posture is conservative (default deny) and now explicitly paired with the supporting indexes and trigger helpers required for performant, deterministic policy checks.
- Operational gaps (migrations, quotas, storage metadata contract, retention, reproducibility) have remediation steps defined and reflected in the v2 data model.

## Strengths
- **Explicit constraints**: Frequent use of `check` constraints for enumerations (e.g., `file_role`, `source_input_type`, `calculator`, units) prevents invalid states.
- **Referential integrity**: All core tables reference owning parents with `on delete cascade` where appropriate, reducing orphaned records.
- **Time ordering**: Most tables include `created_at` (and some `updated_at`) columns plus suggested indexes for recency queries.
- **RLS design**: Per-table rules consistently scope access through `auth.uid()` and project ownership, reducing cross-tenant leakage risk.

## Gaps & Risks (now addressed in v2 design)
- **`updated_at` maintenance** → explicit `touch_updated_at()` trigger for all tables with `updated_at` plus soft-delete trigger paths.
- **Missing uniqueness** → add `unique (user_id, lower(name))` on `projects` and `unique (project_id, lower(name))` on `fcf_records`.
- **Join-heavy RLS** → add helper indexes on all join keys prior to enabling policies; migrations require these indexes.
- **Storage coupling** → enforce storage metadata contract (`upload_id`, `project_id`, `owner_user_id`) mirrored in `storage_metadata` column and bucket policies.
- **Enum drift** → generate shared TypeScript types from SQL checks/enums during migrations to keep literals aligned.
- **Soft deletes** → introduce `deleted_at` on user-owned tables, soft-delete triggers, and RLS checks that exclude deleted parents.
- **Measurement reproducibility** → add `calculator_version`, optional `schema_version`, `source_unit`, and `conversion_notes` to measurements.
- **Project-level quotas** → create `project_quotas` table with default limits and attach enforcement triggers to insert paths.
- **RLS bypass paths** → restrict service-role usage to audited server actions; storage policies require metadata mapping to `uploads`.
- **Migration order gaps** → wrap migrations in transactions, include index creation before RLS enablement, and run smoke tests in `auth.uid()` contexts.

## Remediation plan (implemented in Data Model v2)
1. **Triggers and soft delete**: Add `touch_updated_at()` + soft-delete triggers to projects, FCF records, uploads, interpretation runs, measurements, and settings; ensure RLS excludes soft-deleted parents.
2. **Supporting indexes for RLS**: Create indexes on `projects.user_id`, `fcf_records.project_id`, `measurements.fcf_record_id`, `fcf_interpretation_runs.fcf_record_id`, and `uploads.project_id` before enabling policies.
3. **Enum/source-of-truth generation**: During migrations, emit shared TypeScript types from SQL checks/enums for `file_role`, `source_input_type`, `calculator`, units, and confidence values.
4. **Name uniqueness**: Enforce `unique (user_id, lower(name))` for projects and `unique (project_id, lower(name))` for FCF records to keep UX deterministic.
5. **Storage policy contract**: Require bucket object metadata `upload_id`, `project_id`, `owner_user_id` and mirror it into `uploads.storage_metadata`; soft-delete uploads set `status = 'deleted'` + `deleted_at` and are cleaned up per retention policy.
6. **Measurement reproducibility**: Extend measurements with `calculator_version`, optional `schema_version`, `source_unit`, and `conversion_notes` to make reruns comparable.
7. **Quotas and retention**: Introduce `project_quotas` defaults and attach enforcement triggers on insert paths for uploads/FCFs/interpretations/measurements; define retention for soft-deleted uploads and audit trails for service-role actions.
8. **Migration hardening**: Wrap migrations in transactions, include index creation before RLS enablement, and add smoke tests (`set local role`, `auth.uid()` contexts, `EXPLAIN` policy queries) before promotion.
