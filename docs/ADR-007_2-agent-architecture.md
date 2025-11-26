# ADR-007: 2-Agent AI Architecture

## Status
**Accepted** - November 25, 2025

## Context

DatumPilot's initial design proposed a 4-agent AI architecture:
1. **Extraction Agent** - Parse FCF from images/PDFs
2. **Interpretation Agent** - Generate explanations
3. **Combined Agent** - Cross-validate extraction with interpretation
4. **QA/Adjudicator Agent** - Final quality check and confidence scoring

During architecture review, we identified several concerns:
- **Redundancy**: Combined Agent duplicated validation already performed by deterministic rules engine
- **Complexity**: 4 agents increased latency, cost, and debugging difficulty
- **Authority confusion**: QA Agent could potentially contradict deterministic calculations
- **Cost**: More agents = more API calls = higher costs

## Decision

Adopt a **2-agent architecture** with deterministic core authority:

### Agents Retained
| Agent | Purpose | Input | Output |
|-------|---------|-------|--------|
| **Extraction Agent** | Parse FCF from images/PDFs | Image URL, GD&T symbol definitions | Candidate FCF JSON + parseConfidence |
| **Explanation Agent** | Generate engineering explanation | Validated FCF JSON + CalcResult | Plain English explanation |

### Agents Removed
| Agent | Replacement |
|-------|-------------|
| Combined Agent | User confirmation UI catches extraction errors |
| QA/Adjudicator Agent | Rules engine validates; explanation prompt is constrained by calc results |

### Authority Model
```
User Input → [Extraction Agent] → User Confirmation → [Rules Engine: AUTHORITATIVE]
                                                           ↓
                                                    [Calc Engine: AUTHORITATIVE]
                                                           ↓
                                                    [Explanation Agent: Informational]
```

The deterministic core (rules engine + calculation engine) is **authoritative**. AI agents cannot override validation results or calculations.

## Consequences

### Positive
- **Simpler system**: 2 agents vs 4 reduces complexity by 50%
- **Lower latency**: Fewer sequential AI calls
- **Lower cost**: ~50% reduction in AI API costs
- **Clearer authority**: Deterministic engines are single source of truth
- **Easier debugging**: Fewer moving parts

### Negative
- **User responsibility**: Users must verify extraction accuracy (mitigated by confirmation UI)
- **Less redundancy**: No AI cross-validation (mitigated by deterministic validation)

### Neutral
- Confidence scoring now derived from `parseConfidence + validationClean` instead of QA agent assessment

## Alternatives Considered

1. **Keep 4-agent design** - Rejected due to redundancy and cost
2. **Single agent (extraction + explanation combined)** - Rejected; separation allows caching optimization and clearer prompts
3. **3-agent (drop only QA)** - Rejected; Combined Agent still redundant with user confirmation

## References
- `docs/06_ai_architecture.md` - Full architecture specification
- `docs/architecture_update_summary.md` - Migration checklist
