# ADR-010: Stack-Up Analysis Module

## Status
**Accepted** - December 2025

## Context

DatumPilot's initial scope focused on Feature Control Frame (FCF) building and interpretation. Users requested tolerance stack-up analysis capabilities to complement FCF work:

- Calculate cumulative tolerances across a dimension chain
- Support industry-standard analysis methods
- Integrate with the existing project structure
- Provide visualization of tolerance contributions

### User Requirements
1. Multiple analysis methods (Worst-Case, RSS, Six Sigma)
2. Easy dimension entry with +/- tolerances
3. Pass/fail against acceptance criteria
4. Visual contribution breakdown
5. Method comparison for design decisions

## Decision

Add a **Stack-Up Analysis Module** as a standalone feature within DatumPilot, with:

### Analysis Methods

| Method | Formula | Use Case |
|--------|---------|----------|
| **Worst-Case** | ±(Σ\|tol_i\|) | Safety-critical, 100% interchangeability required |
| **RSS** | ±√(Σtol_i²) | Statistical tolerance, assumes normal distribution |
| **Six Sigma** | ±3σ where σ = √(Σ(tol_i/3)²) | High-reliability, Cpk-aware analysis |

### Data Model

```sql
stackup_analyses (
  id uuid primary key,
  project_id uuid references projects(id),
  name text not null,
  measurement_objective text not null,
  acceptance_criteria jsonb,      -- { min?, max?, maxTolerance? }
  positive_direction text,        -- 'left-to-right' | 'right-to-left' | etc.
  dimensions jsonb,               -- Array of StackupDimension
  analysis_method text,           -- 'worst-case' | 'rss' | 'six-sigma'
  unit text default 'mm',
  result jsonb,                   -- StackupResult when calculated
  ...
)
```

### Calculation Engine

Pure TypeScript module with:
- Zod schema validation for inputs
- Deterministic calculations (authoritative)
- Contribution percentage calculation per dimension
- Mean shift correction for asymmetric tolerances
- Pass/fail evaluation against acceptance criteria

```typescript
// lib/stackup/calculator.ts
function calculateStackup(
  dimensions: StackupDimension[],
  method: AnalysisMethod,
  acceptanceCriteria?: AcceptanceCriteria
): StackupResult;
```

### UI Components

| Component | Purpose |
|-----------|---------|
| `StackupCard` | Card for list view with status indicator |
| `StackupDimensionTable` | Editable dimension entry with +/- toggle |
| `StackupResultsPanel` | Results display with range visualization |
| `StackupContributionChart` | Pareto-style contribution breakdown |

### Page Structure

```
/app/stackup/          # List all analyses
/app/stackup/new       # 4-step creation wizard
/app/stackup/[id]      # View/edit analysis details
```

### Integration Points

1. **Dashboard**: Quick action card for stack-up analysis
2. **Sidebar**: Navigation item (code: 04)
3. **Projects**: Stack-up analyses belong to projects (future)
4. **Export**: JSON export of analysis data (future)

## Consequences

### Positive
- **Complementary feature**: Stack-up analysis alongside FCF interpretation
- **Deterministic**: Calculation engine is authoritative (like FCF rules engine)
- **Multiple methods**: Users can compare Worst-Case vs RSS vs Six Sigma
- **Visual feedback**: Contribution chart helps identify critical dimensions
- **Consistent UX**: Same technical panel styling as rest of app

### Negative
- **Standalone for v1**: Not linked to FCF records (could be future enhancement)
- **No AI explanation**: Stack-up results not explained by AI agent (could be added)

### Neutral
- Uses same project structure as FCF records
- Follows same RLS patterns for multi-tenant isolation

## Algorithm Details

### Mean Shift Correction

For asymmetric tolerances (+0.1/-0.2), the mean shifts from nominal:

```typescript
const meanShift = (plusTolerance - minusTolerance) / 2;
const correctedNominal = nominal + meanShift;
const symmetricTolerance = (plusTolerance + minusTolerance) / 2;
```

### Contribution Percentage

```typescript
// For RSS/Six Sigma
const variance_i = tolerance_i²;
const totalVariance = Σvariance_i;
const contribution_i = (variance_i / totalVariance) * 100;
```

### Pass/Fail Evaluation

```typescript
const passes = (
  (!criteria.min || result.min >= criteria.min) &&
  (!criteria.max || result.max <= criteria.max) &&
  (!criteria.maxTolerance || result.totalTolerance <= criteria.maxTolerance)
);
```

## Future Enhancements

1. **Link to FCF records**: Pull tolerances from FCF calculations
2. **AI explanation**: Generate explanation of stack-up results
3. **Export to PDF/Excel**: Report generation
4. **Sensitivity analysis**: Monte Carlo simulation
5. **Template dimensions**: Reusable dimension sets

## References
- `docs/05_architecture_overview.md` - Architecture with stack-up module
- `lib/stackup/schema.ts` - Zod schemas
- `lib/stackup/calculator.ts` - Calculation engine
- `components/stackup/` - UI components
