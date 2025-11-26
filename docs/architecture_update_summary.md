# DatumPilot - Architecture Update Summary

## Document Info
- **Date**: November 25, 2025
- **Change**: 4-Agent → 2-Agent Architecture + GPT-5.1 Model Selection

---

## Overview of Changes

This document summarizes all changes needed across project documentation to reflect:

1. **2-Agent Architecture** (Extraction + Explanation) replacing 4-Agent design
2. **GPT-5.1** as recommended model for both agents
3. **Deterministic authority** for rules/calculation engines (unchanged, but clarified)

---

## Document-by-Document Changes

### 1. docs/05_architecture_overview.md

**Section 1 - AI Orchestration**

| Find | Replace With |
|------|--------------|
| "multi-agent AI orchestration" | "2-agent AI architecture" |
| "4 specialized agents" | "2 specialized agents (Extraction + Explanation)" |
| References to Combined Agent | Remove entirely |
| References to QA/Adjudicator Agent | Remove entirely |

**Section 2 - Agent Responsibilities**

Replace agent table with:

```markdown
| Agent | Purpose | Model |
|-------|---------|-------|
| Extraction Agent | Parse FCF from images/PDFs → JSON | GPT-5.1 |
| Explanation Agent | Generate engineering-format explanation | GPT-5.1 |
```

**ADR Section**

Add new ADR reference:
- ADR-007: 2-Agent Architecture (supersedes 4-agent design)
- ADR-008: GPT-5.1 Model Selection

---

### 2. docs/04_roadmap.md

**Sprint 3 - AI Orchestration**

| Find | Replace With |
|------|--------------|
| "Implement 4-agent pipeline" | "Implement 2-agent pipeline (Extraction + Explanation)" |
| "Combined Agent implementation" | Remove |
| "QA Agent implementation" | Remove |
| "Agent arbitration logic" | "Confidence derivation from parseConfidence + validation" |

**M3 Milestone**

Update deliverables:
- ~~4 specialized AI agents~~ → 2 specialized AI agents
- ~~Agent arbitration system~~ → Deterministic validation + derived confidence
- Add: "GPT-5.1 integration with prompt caching"

---

### 3. docs/01_product_alignment.md

**Section 1 - Technical Approach**

| Find | Replace With |
|------|--------------|
| "multi-agent orchestration pattern" | "2-agent architecture with deterministic core" |
| Any 4-agent references | "Extraction Agent + Explanation Agent" |

---

### 4. Planning/PRD_GDT_FCF_Builder_Interpreter_Revised.md

**Section 9 - AI Architecture (COMPLETE REWRITE)**

Replace entire section with:

```markdown
## 9. AI Architecture

### 9.1 Overview

DatumPilot uses a 2-agent architecture where AI assists with extraction and explanation,
while deterministic engines maintain authority over validation and calculations.

### 9.2 Agents

| Agent | Model | Purpose |
|-------|-------|---------|
| Extraction Agent | GPT-5.1 | Parse FCF from images → JSON |
| Explanation Agent | GPT-5.1 | Generate plain English explanation |

### 9.3 Deterministic Core (Authoritative)

- **Rules Engine**: ASME Y14.5-2018 validation, error codes E001-E0xx
- **Calculation Engine**: Bonus tolerance, virtual condition, pass/fail

### 9.4 Key Principle

AI cannot override deterministic results. The Explanation Agent receives
CalcResult as input and must use those exact values in its output.

### 9.5 Cost Estimate

~$0.003-0.008 per request with GPT-5.1 and prompt caching.
Monthly estimate: $30-80 at 10K requests.
```

---

### 5. Planning/gdt_fcf_project_plan.md

**Phase 4 - AI Multi-Agent Orchestration**

| Find | Replace With |
|------|--------------|
| "4 specialized agents" | "2 specialized agents" |
| "Combined Agent" tasks | Remove |
| "QA/Adjudicator Agent" tasks | Remove |
| "Agent arbitration" | "Confidence derivation" |

Update task list:
```markdown
Phase 4: AI Integration
- [ ] Extraction Agent prompt engineering
- [ ] Extraction Agent GPT-5.1 integration
- [ ] Prompt caching setup (GD&T symbols, schema)
- [ ] Explanation Agent prompt engineering
- [ ] Explanation Agent GPT-5.1 integration
- [ ] Confidence derivation logic
- [ ] End-to-end /api/fcf/interpret orchestration
```

---

### 6. Planning/master_prompt_pack.md

**Prompts 4.1, 4.2, 4.3**

| Section | Change |
|---------|--------|
| Prompt 4.1 (Combined Agent) | DELETE or mark deprecated |
| Prompt 4.2 (QA Agent) | DELETE or mark deprecated |
| Prompt 4.3 (Arbitration) | DELETE or mark deprecated |

**Add New Prompts:**

```markdown
### 4.1 Extraction Agent System Prompt

You are a GD&T extraction specialist. Parse Feature Control Frames from
engineering drawing images and output structured JSON.

[See full prompt in docs/06_ai_architecture.md Section 5.1]

### 4.2 Explanation Agent System Prompt

You are explaining a GD&T Feature Control Frame to an engineer.
CRITICAL: Use exact numeric values from CalcResult. Do not compute your own.

[See full prompt in docs/06_ai_architecture.md Section 5.2]
```

---

### 7. CLAUDE.md

**Section 4 - Architecture Patterns**

| Find | Replace With |
|------|--------------|
| "multi-agent pattern with 4 agents" | "2-agent pattern (Extraction + Explanation)" |
| Combined Agent reference | Remove |
| QA Agent reference | Remove |

Add:
```markdown
### AI Model
- Primary: GPT-5.1 (both agents)
- See: docs/06_ai_architecture.md for full details
```

---

## API Endpoint Changes

### Keep (rename/clarify as needed)

| Endpoint | Purpose |
|----------|---------|
| `/api/ai/extract-fcf` | Extraction Agent |
| `/api/fcf/interpret` | Main orchestrator (extraction → validation → calculation → explanation) |

### Remove

| Endpoint | Reason |
|----------|--------|
| ~~`/api/ai/combined-fcf`~~ | No Combined Agent |
| ~~`/api/ai/qa-fcf`~~ | No QA Agent |

---

## New Documents Created

| Document | Purpose |
|----------|---------|
| `docs/06_ai_architecture.md` | Comprehensive AI architecture and model selection reference |
| This document | Change summary for updating existing docs |

---

## Implementation Checklist

- [ ] Create `docs/06_ai_architecture.md` (DONE)
- [ ] Update `docs/05_architecture_overview.md`
- [ ] Update `docs/04_roadmap.md`
- [ ] Update `docs/01_product_alignment.md`
- [ ] Update `Planning/PRD_GDT_FCF_Builder_Interpreter_Revised.md`
- [ ] Update `Planning/gdt_fcf_project_plan.md`
- [ ] Update `Planning/master_prompt_pack.md`
- [ ] Update `CLAUDE.md`
- [ ] Remove deprecated API endpoint stubs (if any exist)
- [ ] Add ADR-007 (2-Agent Architecture)
- [ ] Add ADR-008 (GPT-5.1 Model Selection)

---

## Quick Reference

### Old (4-Agent)
```
Extraction → Combined → QA/Adjudicator → Output
     ↓          ↓            ↓
  Parse      Cross-      Arbitrate
  image     validate    + confidence
```

### New (2-Agent)
```
Extraction → User Confirm → Rules Engine → Calc Engine → Explanation
     ↓            ↓              ↓              ↓             ↓
  Parse        Edit if      Validate       Compute        Explain
  image        needed      (authority)   (authority)    (constrained)
```

### Model
- **GPT-5.1** for both agents
- Cost: ~$0.003-0.008/request with caching
- Why: Best multimodal (84.2% MMMU), 24h prompt caching, 2-3x cheaper than Claude Sonnet 4.5
