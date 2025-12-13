# DatumPilot - AI Architecture

## Document Info
- **Version**: 2.0
- **Last Updated**: December 2025
- **Status**: Approved

---

## 1) Executive Summary

DatumPilot uses a **single-agent AI architecture** with **Claude Opus 4.5** as the primary model and **OpenAI GPT-4.1** as fallback. This design prioritizes:

- **Accuracy**: Claude Opus 4.5 excels at instruction following
- **Deterministic authority**: AI explains but cannot override calculations
- **Reliability**: Automatic failover to OpenAI on errors
- **Cost efficiency**: Prompt caching reduces token costs by ~90%

### What Changed from Original Design

| Original (v1.0) | Current (v2.0) |
|-----------------|----------------|
| 2-agent GPT-5.1 (Extraction + Explanation) | Single-agent Claude Opus 4.5 (Explanation only) |
| Image interpretation (Mode 1) | Removed from v1 scope |
| Extraction Agent | Removed (no image input) |
| parseConfidence from extraction | Removed (builder input is always confident) |

---

## 2) Architecture Overview

### 2.1 Single-Agent Pattern

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INPUT                                      │
│                         (FCF Builder Form)                                   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DETERMINISTIC CORE (Authority)                        │
│  ┌─────────────────────────────┐    ┌─────────────────────────────────────┐ │
│  │      RULES ENGINE           │    │       CALCULATION ENGINE            │ │
│  │                             │    │                                     │ │
│  │  • ASME Y14.5-2018 only     │    │  • Bonus tolerance                  │ │
│  │  • Validate characteristic  │    │  • Virtual condition                │ │
│  │  • Datum requirements       │    │  • Effective tolerance              │ │
│  │  • Modifier compatibility   │    │  • Pass/fail determination          │ │
│  │  • Error codes E001-E00x    │    │  • Unit conversion                  │ │
│  └──────────────┬──────────────┘    └───────────────┬─────────────────────┘ │
│                 │                                   │                        │
│                 ▼                                   ▼                        │
│         ValidationResult                    CalcResult                       │
│         (errors block save)                 (authoritative numbers)          │
└─────────────────────────────────────────────────────┬───────────────────────┘
                                                      │
                            ┌─────────────────────────┴─────────────┐
                            │ Only proceeds if validation passes     │
                            └─────────────────────────┬─────────────┘
                                                      │
                                                      ▼
                            ┌─────────────────────────────────────┐
                            │     AI PROVIDER ABSTRACTION         │
                            │                                     │
                            │  Primary: Claude Opus 4.5           │
                            │  Fallback: OpenAI GPT-4.1           │
                            │  Features:                          │
                            │   • Prompt caching (Anthropic)      │
                            │   • Automatic retry (2 attempts)    │
                            │   • Exponential backoff             │
                            │   • Provider failover               │
                            └──────────────┬──────────────────────┘
                                           │
                                           ▼
                            ┌─────────────────────────────────────┐
                            │        EXPLANATION AGENT            │
                            │                                     │
                            │  Input:                             │
                            │   • Validated FCF JSON              │
                            │   • CalcResult (optional)           │
                            │   • ValidationResult                │
                            │                                     │
                            │  Modes:                             │
                            │   • With CalcResult: explains       │
                            │     results using exact numbers     │
                            │   • Specification-only: explains    │
                            │     meaning and measurement approach│
                            │                                     │
                            │  Output:                            │
                            │   • Engineering-format explanation  │
                            │   • AI metadata (provider, tokens)  │
                            └─────────────────────────────────────┘
```

### 2.2 Provider Abstraction Layer

Located at `apps/web/lib/ai/providers/`:

| File | Purpose |
|------|---------|
| `types.ts` | Core interfaces (AIProvider, ExplanationInput/Output) |
| `prompts.ts` | Centralized prompts with GDT_REFERENCE_CONTENT for caching |
| `anthropic.ts` | Claude Opus 4.5 implementation with prompt caching |
| `openai.ts` | OpenAI GPT-4.1 fallback implementation |
| `factory.ts` | Provider factory with retry and fallback logic |
| `index.ts` | Clean exports |

### 2.3 What Was Removed

| Original Component | Why Removed |
|--------------------|-------------|
| Mode 1 (Image Interpretation) | Simplified v1 scope |
| Extraction Agent | No longer needed without image input |
| parseConfidence | Builder input is always 1.0 confidence |
| Combined Agent | Never implemented (from 4-agent design) |
| QA Agent | Never implemented (from 4-agent design) |

---

## 3) Model Selection

### 3.1 Primary: Claude Opus 4.5

| Criterion | Value |
|-----------|-------|
| Model ID | `claude-opus-4-5-20250514` |
| Context | 200K tokens |
| Prompt caching | Yes (reduces costs ~90%) |
| Cache TTL | 5 minutes (automatic refresh on use) |
| Instruction following | Excellent |

### 3.2 Fallback: OpenAI GPT-4.1

| Criterion | Value |
|-----------|-------|
| Model ID | `gpt-4.1` |
| Context | 128K tokens |
| JSON mode | Yes |
| Used when | Claude fails after retries |

### 3.3 Configuration

Environment variables:
```bash
ANTHROPIC_API_KEY=sk-ant-...    # Required for primary provider
OPENAI_API_KEY=sk-...           # Required for fallback
AI_PRIMARY_PROVIDER=anthropic   # Default: "anthropic"
AI_FALLBACK_PROVIDER=openai     # Default: "openai", can be "none"
```

---

## 4) API Endpoints

### 4.1 Current Structure

| Endpoint | Purpose |
|----------|---------|
| `/api/fcf/interpret` | Orchestrator: validate → calculate → explain |

**Removed endpoints:**
- ~~`/api/ai/extract-fcf`~~ - No longer needed (no image input)

### 4.2 Response Format

```typescript
interface InterpretFcfResponse {
  status: 'ok' | 'error';
  fcf?: FcfJson;
  validation?: ValidationResult;
  calcResult?: CalcResult;
  explanation?: string;
  confidence?: 'high' | 'medium' | 'low';
  warnings?: string[];
  aiMetadata?: {
    provider: 'anthropic' | 'openai';
    model: string;
    cacheStatus?: 'hit' | 'miss';
    inputTokens?: number;
    outputTokens?: number;
  };
}
```

### 4.3 Orchestration Flow

```typescript
// Pseudocode for /api/fcf/interpret
async function interpretFcf(input: InterpretRequest): Promise<InterpretResponse> {
  // Step 1: Get FCF JSON (always from builder or direct input now)
  const fcfJson = input.fcfJson;

  // Step 2: Deterministic validation (AUTHORITATIVE)
  const validation = rulesEngine.validate(fcfJson);
  if (!validation.isValid) {
    return { errors: validation.errors }; // HARD STOP
  }

  // Step 3: Deterministic calculation (OPTIONAL - requires measurements)
  let calcResult: CalcResult | undefined;
  if (input.measurements) {
    calcResult = calculationEngine.compute(fcfJson, input.measurements);
  }

  // Step 4: Generate explanation (adapts to presence of calcResult)
  const explanation = await explanationAgent.explain(fcfJson, calcResult, validation);

  // Step 5: Derive confidence from validation only
  const confidence = deriveConfidence(validation);

  return {
    fcfJson,
    calcResult,
    explanation,
    confidence,
    warnings: validation.warnings,
    aiMetadata: explanation.metadata
  };
}
```

---

## 5) Prompt Engineering

### 5.1 Cached Content

The `GDT_REFERENCE_CONTENT` (~1500 tokens) is cached using Anthropic's prompt caching:

```typescript
const GDT_REFERENCE_CONTENT = `
GD&T SYMBOL REFERENCE:
- ⌖ Position - Controls location of feature
- ⏥ Flatness - Controls form (no datums)
- ⟂ Perpendicularity - Controls orientation relative to datum
- ⌰ Circular Runout - Controls surface relative to datum axis
Note: Concentricity and Symmetry removed from ASME Y14.5-2018
...

MATERIAL CONDITIONS:
- Ⓜ MMC (Maximum Material Condition) - Most material present
- Ⓛ LMC (Least Material Condition) - Least material present
- Ⓕ RFS (Regardless of Feature Size) - Default, no bonus

ASME Y14.5-2018 RULES:
- Position requires at least one datum
- Flatness cannot have datums
- MMC/LMC only applicable to Features of Size
...
`;
```

Cache statistics are included in the response metadata.

### 5.2 Explanation Agent Prompt Structure

Two modes of operation:

**With CalcResult:**
```
You are explaining a GD&T Feature Control Frame to an engineer.

CRITICAL: You MUST use the exact numeric values from CalcResult.
DO NOT compute your own values. The calculation engine is authoritative.

OUTPUT FORMAT:
──────────────────────────────────────────────────────────────────
  GIVEN (FCF Definition)
    Characteristic, Tolerance Zone, Datums, Material Conditions...

  DERIVED VALUES (from CalcResult - use exact numbers)
    T_geo, bonus tolerance, virtual condition, etc.

  INTERPRETATION
    Plain English explanation with calculation results
```

**Without CalcResult (Specification-Only):**
```
You are explaining what a GD&T FCF specification means.

OUTPUT FORMAT:
──────────────────────────────────────────────────────────────────
  SUMMARY
    What geometric characteristic is controlled

  DATUMS & PRECEDENCE
    How the Datum Reference Frame constrains the part

  MATERIAL CONDITION EFFECTS
    MMC/LMC/RFS effects and bonus tolerance potential

  MEASUREMENT GUIDANCE
    How this tolerance would be measured/verified
```

---

## 6) Confidence Scoring

Simplified derivation (no parseConfidence since no image extraction):

```typescript
function deriveConfidence(validation: ValidationResult): 'high' | 'medium' | 'low' {
  if (validation.summary.errorCount > 0) return 'low';
  if (validation.summary.warningCount > 0) return 'medium';
  return 'high';
}
```

For builder input, confidence is always derived from validation results only.

---

## 7) Error Handling

### 7.1 Retry Logic

```typescript
const RETRY_CONFIG = {
  maxAttempts: 2,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  retryableErrors: [
    'rate_limit_error',
    'overloaded_error',
    'timeout',
    /^5\d{2}$/  // 5xx status codes
  ]
};
```

### 7.2 Fallback Logic

If primary provider (Claude) fails after retries:
1. Log warning with correlation ID
2. Attempt fallback provider (OpenAI)
3. If fallback fails, return error to user with helpful message

```typescript
async function generateWithFallback(input: ExplanationInput): Promise<ExplanationOutput> {
  try {
    return await primaryProvider.generate(input);
  } catch (primaryError) {
    logger.warn('Primary provider failed, attempting fallback', {
      error: primaryError,
      correlationId
    });

    if (fallbackProvider) {
      return await fallbackProvider.generate(input);
    }

    throw primaryError;
  }
}
```

---

## 8) Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Explanation latency | < 3 seconds P90 | With caching |
| Total `/api/fcf/interpret` | < 4 seconds P90 | Including validation + calc |
| Cache hit rate | > 80% | After warmup |
| Cost per request | < $0.02 | With prompt caching |

---

## 9) Authority Model

| Data | Source | Authority |
|------|--------|-----------|
| FCF JSON structure | Builder form | User-confirmed, then rules-validated |
| Validation pass/fail | Rules Engine | **Deterministic, authoritative** |
| Error codes (E001, etc.) | Rules Engine | **Deterministic, authoritative** |
| Bonus tolerance | Calculation Engine | **Deterministic, authoritative** |
| Virtual condition | Calculation Engine | **Deterministic, authoritative** |
| Pass/fail | Calculation Engine | **Deterministic, authoritative** |
| Natural language explanation | Explanation Agent | Informational only, constrained by calc results |

---

## 10) Future Considerations

### 10.1 When to Revisit Architecture

- User demand for image interpretation (Mode 1)
- Anthropic releases Claude 4 with improved capabilities
- OpenAI releases GPT-5 with competitive pricing
- Need for batch processing or async workflows

### 10.2 Potential Enhancements

- **Fine-tuning**: If explanation quality needs improvement
- **Streaming**: For longer explanations, stream responses
- **Hybrid**: Different models for different complexity levels
- **Image support**: Re-add Extraction Agent if Mode 1 is reinstated

---

## 11) References

- Anthropic Claude Opus 4.5 Documentation
- OpenAI GPT-4.1 API Reference
- ASME Y14.5-2018 Standard
- DatumPilot PRD v2.0
- ADR-009: Single-Agent Architecture Migration
