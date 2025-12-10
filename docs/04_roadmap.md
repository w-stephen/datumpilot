# DatumPilot – Roadmap (v1.1)

## Document Info
- **Version**: 1.1
- **Last Updated**: December 2025
- **Status**: In Progress

---

## 1) Phase Overview (v1 scope)

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | Complete | Architecture & Platform Foundations |
| Phase 2 | Complete | Core Engine (Schema, Rules, Calculations, Stack-Up) |
| Phase 3 | Complete | AI Architecture (Single-agent Claude Opus 4.5) |
| Phase 4 | In Progress | Core Features (Builder, Interpreter, Exports) |
| Phase 5 | Pending | Projects & Settings Integration |
| Phase 6 | Pending | Testing, Security & Launch |

### What Changed from Original Roadmap

| Original | Current |
|----------|---------|
| 2-agent GPT-5.1 architecture | Single-agent Claude Opus 4.5 with OpenAI fallback |
| Image interpreter (Mode 1) | Removed from v1 scope |
| parseConfidence field | Removed (no image extraction) |
| — | Added Stack-Up Analysis module |

---

## 2) Phase Details

### Phase 1: Architecture & Platform Foundations (Complete)
- Next.js 15 App Router with TypeScript
- Supabase auth/RLS baseline
- Base schema (projects, fcf_records, measurements, user_settings)
- CI/CD pipeline with quality checks
- App shell and routing structure

**Deliverables:**
- [x] Repo structure and monorepo setup
- [x] Supabase project with RLS policies
- [x] Auth flow (magic link, OAuth)
- [x] Base database migrations
- [x] CI pipeline (lint, typecheck, test)

### Phase 2: Core Engine (Complete)

#### Phase 2A: FCF Schema & Rules
- Canonical FcfJson schema with Zod validation
- ASME Y14.5-2018 validation rules (E001-E00x)
- Error codes and messages

**Deliverables:**
- [x] `lib/fcf/schema.ts` - FcfJson type and Zod schema
- [x] `lib/rules/validateFcf.ts` - Validation engine
- [x] `lib/rules/errorCodes.ts` - Standardized error codes

#### Phase 2B: Calculations Engine
- Position @ MMC calculator with bonus tolerance
- Flatness, perpendicularity, profile calculators
- Units and precision utilities

**Deliverables:**
- [x] `lib/calc/position.ts` - Position calculator
- [x] `lib/calc/flatness.ts` - Flatness calculator
- [x] `lib/calc/perpendicularity.ts` - Perpendicularity calculator
- [x] `lib/calc/profile.ts` - Profile calculator
- [x] `lib/format/` - Units and formatting utilities

#### Phase 2C: Stack-Up Analysis
- Tolerance stack-up calculation engine
- Worst-Case, RSS, Six Sigma methods
- Contribution percentage calculations
- Mean shift correction for asymmetric tolerances

**Deliverables:**
- [x] `lib/stackup/schema.ts` - Stack-up Zod schemas
- [x] `lib/stackup/calculator.ts` - Calculation engine
- [x] `migrations/005_create_stackup_analyses.sql` - Database table
- [x] Stack-up UI components (Card, DimensionTable, ResultsPanel, ContributionChart)
- [x] Stack-up pages (list, new wizard, detail/edit)

### Phase 3: AI Architecture (Complete)
- Single-agent architecture with Explanation Agent only
- Provider abstraction layer (Claude primary, OpenAI fallback)
- Prompt caching for cost efficiency

**Deliverables:**
- [x] `lib/ai/providers/` - Provider abstraction
- [x] `lib/ai/prompts/` - Explanation prompts with GDT reference
- [x] `lib/ai/orchestrator.server.ts` - Server-only orchestration
- [x] `/api/fcf/interpret` - Interpretation endpoint

### Phase 4: Core Features (In Progress)

#### FCF Builder
- Form-based FCF construction
- Live SVG preview
- Real-time validation with error display
- Material condition handling (MMC/LMC/RFS)

**Status:** In Progress
- [x] Builder page structure
- [x] Characteristic selector
- [x] Tolerance input with material conditions
- [ ] Datum selection with validation
- [ ] Live SVG preview component
- [ ] Save to project flow

#### JSON Interpreter
- JSON input with schema validation
- Calculation execution
- AI-powered explanation generation
- Results display

**Status:** In Progress
- [x] JSON input component
- [x] Validation display
- [ ] Calculator integration
- [ ] Explanation panel
- [ ] Export functionality

#### Exports
- PNG export (server-side SVG rasterization)
- SVG export
- JSON export

**Status:** Pending
- [ ] SVG generation from FcfJson
- [ ] PNG rasterization with sharp
- [ ] Export API endpoints
- [ ] Download UI

### Phase 5: Projects & Settings (Pending)

#### Projects
- Project CRUD operations
- FCF records listing
- Measurement runs capture
- Upload management (exports)

**Tasks:**
- [ ] Project list with search/filter
- [ ] Project detail page
- [ ] FCF record management
- [ ] Measurement run capture

#### Settings
- Units preference (mm/inch)
- Decimal precision (1-4)
- Dual display toggle

**Tasks:**
- [ ] Settings page UI
- [ ] Settings persistence
- [ ] Global settings context

### Phase 6: Testing, Security & Launch (Pending)

#### Testing
- Unit tests for calculations
- Integration tests for API routes
- E2E tests for critical flows

#### Security
- RLS policy verification
- Signed URL testing
- Input sanitization audit

#### Performance
- Live preview latency < 50ms
- `/api/fcf/interpret` P90 < 400ms
- Stack-up calculations < 10ms

#### Launch
- Production deployment
- Observability dashboards
- SME validation with test FCF set
- Release notes

---

## 3) Milestones

| Milestone | Target | Status |
|-----------|--------|--------|
| M1 | Platform foundations complete | Complete |
| M2 | Core engine complete (schema, rules, calc, stack-up) | Complete |
| M3 | AI architecture complete | Complete |
| M4 | Builder + Interpreter functional | In Progress |
| M5 | Projects/Settings integrated | Pending |
| M6 | Production pilot live | Pending |

---

## 4) Risk Mitigation

### Technical Risks

| Risk | Mitigation |
|------|------------|
| AI explanation quality | Deterministic engine is authoritative; AI explains but cannot override |
| AI provider availability | Fallback to OpenAI if Claude unavailable |
| Performance degradation | Prompt caching, async processing, performance budgets |
| Complex GD&T validation | Incremental rule implementation with comprehensive tests |

### Scope Risks

| Risk | Mitigation |
|------|------------|
| Feature creep | Mode 1 (image interpretation) deferred to v2 |
| Complexity | Single-agent vs 2-agent simplifies architecture |
| Timeline | Stack-up analysis added but scoped conservatively |

---

## 5) v2 Backlog (Future Consideration)

Features deferred from v1 for future releases:

| Feature | Priority | Notes |
|---------|----------|-------|
| Image/PDF interpretation (Mode 1) | High | Requires Extraction Agent re-implementation |
| AI explanation for stack-up results | Medium | Extend Explanation Agent |
| Stack-up linked to FCF records | Medium | Pull tolerances from FCF calculations |
| Monte Carlo simulation | Low | Advanced sensitivity analysis |
| PDF/Excel report generation | Medium | Export enhancements |
| STEP file tolerance extraction | Low | CAD integration |

---

## 6) Dependencies

### External Services
- **Supabase**: Auth, database, storage
- **Anthropic**: Claude Opus 4.5 API
- **OpenAI**: GPT-4.1 fallback API
- **Vercel**: Hosting and deployment

### Internal Dependencies
```
Phase 1 (Platform)
    └─► Phase 2A (Schema/Rules)
            └─► Phase 2B (Calculations)
                    └─► Phase 2C (Stack-Up)
                            └─► Phase 3 (AI)
                                    └─► Phase 4 (Features)
                                            └─► Phase 5 (Projects)
                                                    └─► Phase 6 (Launch)
```
