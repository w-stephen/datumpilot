# CI

GitHub Actions workflow lives in `.github/workflows/ci.yml`.

Secrets/vars expected:
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` for deploys.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` for build/runtime.

Behavior:
- PRs and pushes to `main`: lint/typecheck/test/build; deploy to staging on `main`.
- Tags `v*`: deploy to production after quality gates.
