# DatumPilot – Repo Structure & Conventions (Next.js 15)

## 1) Recommended Repo Structure
```
/
  package.json
  tsconfig.base.json
  pnpm-workspace.yaml           # or npm workspaces; keep one lockfile at root
  docs/                         # product and architecture docs (existing)
  packages/                     # optional later: shared cores (fcf-core, ai-orchestrator)
  apps/
    web/                        # Next.js 15 app
      next.config.mjs
      app/
        (marketing)/page.tsx
        app/
          layout.tsx
          page.tsx              # dashboard shell
          builder/page.tsx
          interpreter/page.tsx
          image-interpreter/page.tsx
          projects/page.tsx
          projects/[id]/page.tsx
          settings/page.tsx
        api/                    # route handlers
          fcf/
            interpret/route.ts
            export/route.ts
          ai/
            extract-fcf/route.ts
            interpret-fcf/route.ts
            combined-fcf/route.ts
            qa-fcf/route.ts
          projects/route.ts
          uploads/route.ts
        (styles)/globals.css
      components/
        fcf/
          FcfBuilderPanel.tsx
          FcfPreview.tsx
          FcfExportBar.tsx
          ImageUploadPanel.tsx
          InterpreterForm.tsx
          CalcResults.tsx
        layout/
          AppShell.tsx
          Sidebar.tsx
          TopNav.tsx
        projects/
          ProjectList.tsx
          ProjectDetail.tsx
        settings/
          UnitControls.tsx
      lib/
        fcf/        # canonical schema, zod, helpers
          schema.ts
          examples.ts
        rules/      # validation and error codes
          validateFcf.ts
          errorCodes.ts
        calc/       # deterministic calculators
          position.ts
          flatness.ts
          perpendicularity.ts
          profile.ts
        ai/         # agent prompts and orchestration
          extractionAgent.ts
          interpretationAgent.ts
          combinedAgent.ts
          qaAgent.ts
          orchestrator.ts
        supabase/   # server/client helpers
          client.ts
          storage.ts
        util/       # shared helpers (logging, formatting, units)
          units.ts
          formatting.ts
          logger.ts
          env.ts    # zod-based env validation
      tests/
        unit/
        integration/
        e2e/        # optional, Playwright/Cypress
      public/
        assets/
  infra/
    supabase/       # SQL migrations/policies if managed in-repo
    ci/             # GitHub Actions or other pipelines
```

## 2) Naming Conventions
- Routes/folders: lower-kebab for segments (`image-interpreter`, `projects`).
- Files (modules): prefer `kebab-case.ts`; React components: `PascalCase.tsx`.
- Components: `PascalCase` exports matching filename; colocate styles if needed.
- Types/interfaces: `PascalCase` (`FcfJson`, `ValidationResult`); enums/const objects in `SCREAMING_SNAKE` only when true constants.
- Functions/variables: `camelCase`.
- Error codes: centralize in `errorCodes.ts`, format `E001`–`E00x` with descriptive keys (e.g., `MMC_NOT_ALLOWED`).
- Tests: mirror source path under `tests/{unit|integration}` with `*.test.ts` or `*.spec.ts`; acceptable alternative is co-location next to source if the team prefers—pick one and enforce it.
- Zod schemas: suffix `Schema` (e.g., `fcfSchema`), inferred types `type FcfJson = z.infer<typeof fcfSchema>`.
- Server vs client boundaries:
  - Server-only modules use `.server.ts` suffix where helpful (e.g., `orchestrator.server.ts`, `serverClient.ts`).
  - Avoid importing `lib/ai/*` or `lib/supabase/server*` from client components; add ESLint rules if needed.

## 3) Initial Scripts (package.json)
```json
{
  "scripts": {
    "dev": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "typecheck": "tsc --noEmit",
    "lint:ci": "next lint --max-warnings=0",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ci": "vitest run --runInBand",
    "check": "pnpm lint:ci && pnpm typecheck && pnpm test:ci",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md,mdx}\""
  }
}
```
Adjust for pnpm (`pnpm dev`, etc.) as needed.

## 4) Setup Steps (quick checklist)
1. Init repo + workspace: `pnpm init` (or npm), add `pnpm-workspace.yaml`, root `package.json`, `tsconfig.base.json`.
2. Scaffold Next.js app in `apps/web`: `pnpm create next-app apps/web --ts --eslint --src-dir false --app`.
3. Configure path aliases in `apps/web/tsconfig.json` pointing to `@/lib/*`, `@/components/*`.
4. Add `vitest` + `@testing-library/react` + `prettier` configs; wire scripts above.
5. Create `lib/fcf/schema.ts`, `lib/rules/validateFcf.ts`, `lib/calc/*`, `lib/ai/*` stubs to enforce separation from UI; consider `.server.ts` suffixes for server-only modules.
6. Add Supabase client helpers under `lib/supabase`, an `env.ts` validator (zod), and `.env.example` with required keys.
7. Set up linting/formatting: `.eslintrc`, `.prettierrc`, and run `pnpm lint`, `pnpm format`, `pnpm check`.
8. Decide test placement (central `tests/` vs co-located) and create the matching folders.
9. Commit initial structure; verify `pnpm dev` runs and base routes render.
