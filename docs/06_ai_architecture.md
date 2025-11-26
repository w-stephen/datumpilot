# DatumPilot - AI Architecture & Model Selection

## Document Info
- **Version**: 1.0
- **Last Updated**: November 25, 2025
- **Status**: Approved

---

## 1) Executive Summary

DatumPilot uses a **2-agent AI architecture** with **GPT-5.1** as the recommended model for both agents. This design prioritizes:

- **Accuracy**: Critical for engineering tolerance calculations
- **Deterministic authority**: AI cannot override the rules/calculation engine
- **Cost efficiency**: GPT-5.1 is 2-3x cheaper than alternatives
- **Simplicity**: Fewer agents means easier debugging and maintenance

---

## 2) Architecture Overview

### 2.1 Two-Agent Pattern

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER INPUT                                      │
│              (Image/PDF)                    (Builder Form)                   │
└──────────────┬──────────────────────────────────┬───────────────────────────┘
               │                                  │
               ▼                                  │
┌──────────────────────────┐                      │
│    EXTRACTION AGENT      │                      │
│    (GPT-5.1)             │                      │
│                          │                      │
│    image → candidate     │                      │
│    FCF JSON +            │                      │
│    parseConfidence       │                      │
└──────────────┬───────────┘                      │
               │                                  │
               ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         USER CONFIRMATION / EDIT                             │
│                    (All paths converge to editable form)                     │
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
                            │        EXPLANATION AGENT            │
                            │        (GPT-5.1)                    │
                            │                                     │
                            │  Input:                             │
                            │   • Validated FCF JSON              │
                            │   • CalcResult (authoritative)      │
                            │   • ValidationResult (if warnings)  │
                            │                                     │
                            │  Output:                            │
                            │   • Engineering-format explanation  │
                            │   • References the calc numbers     │
                            └─────────────────────────┬───────────┘
                                                      │
                                                      ▼
                            ┌─────────────────────────────────────┐
                            │          FINAL OUTPUT               │
                            │                                     │
                            │  • Canonical FCF JSON (validated)   │
                            │  • Calculation results (numeric)    │
                            │  • Explanation (engineering format) │
                            │  • Confidence level                 │
                            └─────────────────────────────────────┘
```

### 2.2 Agent Responsibilities

| Agent | Purpose | Input | Output |
|-------|---------|-------|--------|
| **Extraction Agent** | Parse FCF data from images/PDFs | Image URL, GD&T symbol definitions | Candidate FCF JSON + parseConfidence |
| **Explanation Agent** | Generate engineering-format explanation | Validated FCF JSON + CalcResult | Plain English explanation with variable breakdown |

### 2.3 What Was Removed (from original 4-agent design)

| Original Agent | Why Removed | Replacement |
|----------------|-------------|-------------|
| Combined Agent | Redundant cross-validation | User confirmation catches errors |
| QA/Adjudicator Agent | Unnecessary with deterministic authority | Rules engine validates; explanation prompt is constrained |

---

## 3) Model Selection: GPT-5.1

### 3.1 Why GPT-5.1?

**Released**: November 12-13, 2025

| Criterion | GPT-5.1 | Claude Sonnet 4.5 | Winner |
|-----------|---------|-------------------|--------|
| **Price (input)** | $1.25/1M | $3.00/1M | GPT-5.1 (2.4x cheaper) |
| **Price (output)** | $10.00/1M | $15.00/1M | GPT-5.1 (1.5x cheaper) |
| **Context window** | 400K tokens | 200K tokens | GPT-5.1 |
| **Prompt caching** | 24 hours | Available | GPT-5.1 |
| **Multimodal (MMMU)** | 84.2% | 77.8% | GPT-5.1 |
| **SWE-bench** | 74.9% | 77.2% | Sonnet 4.5 |
| **Instruction following** | Excellent | Excellent | Tie |

### 3.2 Key GPT-5.1 Features for DatumPilot

1. **Extended Prompt Caching (24 hours)**
   - Cache GD&T symbol definitions (⌖, ⏥, ⟂, ◎, ⌰)
   - Cache ASME Y14.5-2018 extraction rules
   - Cache JSON schema for FCF output
   - **90% cost savings on cached tokens**

2. **Adaptive Reasoning**
   - GPT-5.1 Instant: Fast for simple extractions
   - GPT-5.1 Thinking: Deeper analysis for complex FCFs

3. **Better Instruction Following**
   - Critical for Explanation Agent to never contradict deterministic calculations

4. **Superior Multimodal Understanding**
   - 84.2% on MMMU benchmark
   - Better for parsing technical drawings

### 3.3 Model Variants

| Variant | Use Case | Price |
|---------|----------|-------|
| **gpt-5.1** | Both agents (recommended) | $1.25/$10 per 1M tokens |
| gpt-5.1-mini | Budget alternative for Explanation Agent | $0.25/$2 per 1M tokens |
| gpt-5.1-codex | If heavy code generation needed | Same as gpt-5.1 |

### 3.4 Cost Projections

| Configuration | Per Request | Monthly (10K) | Monthly (100K) |
|--------------|-------------|---------------|----------------|
| GPT-5.1 (both agents) | ~$0.008 | ~$80 | ~$800 |
| With prompt caching | ~$0.003-0.005 | ~$30-50 | ~$300-500 |
| Claude Sonnet 4.5 (both) | ~$0.017 | ~$170 | ~$1,700 |

---

## 4) API Endpoints

### 4.1 Simplified Endpoint Structure

| Endpoint | Purpose | Model |
|----------|---------|-------|
| `/api/ai/extract-fcf` | Extraction Agent | GPT-5.1 |
| `/api/fcf/interpret` | Orchestrator (calls extraction if image, then explanation) | - |

**Removed endpoints** (from 4-agent design):
- ~~`/api/ai/combined-fcf`~~ - No longer needed
- ~~`/api/ai/qa-fcf`~~ - No longer needed

### 4.2 Orchestration Flow

```typescript
// Pseudocode for /api/fcf/interpret
async function interpretFcf(input: InterpretRequest): Promise<InterpretResponse> {
  let fcfJson: FcfJson;
  let parseConfidence = 1.0;

  // Step 1: Get FCF JSON (extraction or direct input)
  if (input.imageUrl) {
    const extraction = await extractionAgent.parse(input.imageUrl);
    fcfJson = extraction.fcfJson;
    parseConfidence = extraction.parseConfidence;
    // User confirmation happens on frontend before this endpoint is called
  } else {
    fcfJson = input.fcfJson; // From builder or direct input
  }

  // Step 2: Deterministic validation (AUTHORITATIVE)
  const validation = rulesEngine.validate(fcfJson);
  if (!validation.isValid) {
    return { errors: validation.errors }; // HARD STOP
  }

  // Step 3: Deterministic calculation (AUTHORITATIVE)
  const calcResult = calculationEngine.compute(fcfJson, input.measurements);

  // Step 4: Generate explanation (constrained by calc results)
  const explanation = await explanationAgent.explain(fcfJson, calcResult, validation);

  // Step 5: Derive confidence
  const confidence = deriveConfidence(parseConfidence, validation);

  return {
    fcfJson,
    calcResult,
    explanation,
    confidence,
    warnings: validation.warnings
  };
}
```

---

## 5) Prompt Engineering

### 5.1 Extraction Agent Prompt Structure

```typescript
const extractionSystemPrompt = `
You are a GD&T (Geometric Dimensioning and Tolerancing) extraction specialist.

Your task: Parse Feature Control Frames from engineering drawing images and output structured JSON.

CRITICAL RULES:
1. Output ONLY valid JSON matching the FcfJson schema
2. Include parseConfidence (0.0-1.0) based on image clarity and certainty
3. Flag ambiguous symbols with notes
4. Never invent values - use null for unreadable fields

GD&T SYMBOL REFERENCE:
- ⌖ Position
- ⏥ Flatness  
- ⟂ Perpendicularity
- ◎ Concentricity
- ⌰ Circular Runout
- ○ Circularity
- ⊙ Symmetry
- ⌓ Profile of a Line
- ⌔ Profile of a Surface
- Ⓜ MMC (Maximum Material Condition)
- Ⓛ LMC (Least Material Condition)
- Ⓕ RFS (Regardless of Feature Size)

OUTPUT SCHEMA:
${JSON.stringify(fcfJsonSchema, null, 2)}
`;
```

### 5.2 Explanation Agent Prompt Structure

```typescript
const explanationSystemPrompt = `
You are explaining a GD&T Feature Control Frame to an engineer.

CRITICAL CONSTRAINT: You MUST use the exact numeric values provided in the CalcResult.
DO NOT compute your own values. The calculation engine is authoritative.

OUTPUT FORMAT: Engineering-style variable breakdown

GIVEN (FCF Definition)
──────────────────────────────────────────────────────────────────
  Characteristic       : [from FCF JSON]
  Tolerance Zone       : [from FCF JSON]
  ...

DERIVED VALUES
──────────────────────────────────────────────────────────────────
  T_geo    = [from CalcResult] mm    Stated geometric tolerance
  ...

INTERPRETATION
──────────────────────────────────────────────────────────────────
  [Plain English explanation of what the FCF means]
`;
```

---

## 6) Confidence Scoring

Confidence is derived from extraction signals and validation results, not from a QA agent.

```typescript
interface ConfidenceFactors {
  parseConfidence: number;      // From Extraction Agent (0-1)
  validationClean: boolean;     // No errors or warnings from rules engine
  imageQuality?: 'high' | 'medium' | 'low';
}

function deriveConfidence(factors: ConfidenceFactors): 'high' | 'medium' | 'low' {
  if (factors.parseConfidence >= 0.9 && factors.validationClean) {
    return 'high';
  }
  if (factors.parseConfidence >= 0.7 && factors.validationClean) {
    return 'medium';
  }
  return 'low';
}
```

For Mode 2 (Builder), parseConfidence is effectively 1.0 since there's no extraction ambiguity.

---

## 7) Why This Design Works

### 7.1 Deterministic Authority Preserved

| Data | Source | Authority |
|------|--------|-----------|
| FCF JSON structure | Extraction Agent or Builder | User-confirmed, then rules-validated |
| Validation pass/fail | Rules Engine | **Deterministic, authoritative** |
| Error codes (E001, etc.) | Rules Engine | **Deterministic, authoritative** |
| Bonus tolerance | Calculation Engine | **Deterministic, authoritative** |
| Virtual condition | Calculation Engine | **Deterministic, authoritative** |
| Pass/fail | Calculation Engine | **Deterministic, authoritative** |
| Natural language explanation | Explanation Agent | Informational only, constrained by calc results |

### 7.2 Trade-offs Accepted

| 4-Agent Feature | 2-Agent Equivalent | Why It's OK |
|-----------------|-------------------|-------------|
| Combined Agent cross-validation | Single extraction + user confirmation | User catches errors |
| QA Agent contradiction detection | Explanation prompt includes authoritative numbers | LLM is constrained rather than checked |
| QA Agent confidence assignment | Derived from parseConfidence + validation | Simpler, more predictable |

---

## 8) Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Extraction latency | < 3 seconds | Streaming recommended |
| Explanation latency | < 2 seconds | Shorter output |
| Total `/api/fcf/interpret` | < 5 seconds | P90 |
| Cost per request | < $0.01 | With prompt caching |

---

## 9) Future Considerations

### 9.1 When to Revisit Model Selection

- OpenAI releases GPT-5.2 or GPT-6
- Anthropic releases Claude Sonnet 5 with significantly better multimodal
- Google releases Gemini 3 with competitive pricing
- Your extraction accuracy falls below 90% on production data

### 9.2 Potential Enhancements

- **Batch processing**: Use OpenAI Batch API for 50% cost savings on non-real-time workflows
- **Fine-tuning**: If extraction accuracy is insufficient, consider fine-tuning on GD&T examples
- **Hybrid approach**: Use GPT-5.1 for extraction, Claude Sonnet 4.5 for explanation if quality demands

---

## 10) References

- OpenAI GPT-5.1 Announcement (November 12, 2025)
- Anthropic Claude Sonnet 4.5 Announcement (September 29, 2025)
- ASME Y14.5-2018 Standard
- DatumPilot PRD v1.1
