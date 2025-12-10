# ADR-007: 2-Agent AI Architecture

## Status
**Superseded** by [ADR-009](./ADR-009_single-agent-claude-architecture.md) - December 2025

> **Note**: This ADR documented the original 2-agent architecture (Extraction + Explanation).
> With Mode 1 (image interpretation) removed from v1 scope, the Extraction Agent was removed,
> leaving only the Explanation Agent. See ADR-009 for the current single-agent architecture.

---

## Original Decision (November 2025)

Adopted a **2-agent architecture** with deterministic core authority:

### Agents Retained
| Agent | Purpose | Input | Output |
|-------|---------|-------|--------|
| **Extraction Agent** | Parse FCF from images/PDFs | Image URL, GD&T symbol definitions | Candidate FCF JSON + parseConfidence |
| **Explanation Agent** | Generate engineering explanation | Validated FCF JSON + CalcResult | Plain English explanation |

### Authority Model
```
User Input → [Extraction Agent] → User Confirmation → [Rules Engine: AUTHORITATIVE]
                                                           ↓
                                                    [Calc Engine: AUTHORITATIVE]
                                                           ↓
                                                    [Explanation Agent: Informational]
```

## Why Superseded

1. **Mode 1 (Image Interpretation) removed from v1 scope**
   - Extraction Agent no longer needed
   - `parseConfidence` field removed from data model
   - Focus shifted to builder-first approach

2. **Model selection changed**
   - Moved from GPT-5.1 to Claude Opus 4.5 as primary
   - Added OpenAI GPT-4.1 as fallback
   - Provider abstraction layer added

3. **Simplified architecture**
   - Single agent (Explanation) vs two agents
   - Cleaner prompt caching strategy with Anthropic
   - Reduced complexity and cost

## See Also
- [ADR-009: Single-Agent Claude Opus 4.5 Architecture](./ADR-009_single-agent-claude-architecture.md)
- `docs/06_ai_architecture.md` - Current architecture specification
