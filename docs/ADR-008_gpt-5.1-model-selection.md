# ADR-008: GPT-5.1 Model Selection

## Status
**Superseded** by [ADR-009](./ADR-009_single-agent-claude-architecture.md) - December 2025

> **Note**: This ADR documented the original GPT-5.1 model selection for the 2-agent architecture.
> With Mode 1 (image interpretation) removed and the shift to a single-agent architecture,
> we re-evaluated model selection. See ADR-009 for the current Claude Opus 4.5 + OpenAI fallback approach.

---

## Original Decision (November 2025)

Use **GPT-5.1** for both Extraction and Explanation agents based on:
- Superior multimodal understanding (84.2% MMMU) for image extraction
- 24-hour prompt caching for cost efficiency
- 2.4x cheaper input tokens vs Claude Sonnet 4.5

### Original Cost Projections
| Volume | Without Caching | With Caching |
|--------|-----------------|--------------|
| Per request | ~$0.008 | ~$0.003-0.005 |
| 10K/month | ~$80 | ~$30-50 |
| 100K/month | ~$800 | ~$300-500 |

## Why Superseded

1. **Multimodal not needed for v1**
   - Image extraction (Mode 1) removed from scope
   - GPT-5.1's multimodal advantage no longer relevant
   - Single Explanation Agent works with validated FCF JSON, not images

2. **Claude Opus 4.5 advantages for explanation tasks**
   - Superior instruction following for engineering explanations
   - Better at respecting authoritative numbers from deterministic engine
   - More nuanced, educational explanations

3. **Provider diversity**
   - Single-vendor lock-in risk mitigated
   - Claude primary + OpenAI fallback provides redundancy
   - Provider abstraction layer makes switching trivial

4. **Revised cost model**
   - Explanation-only workload different from extraction + explanation
   - Prompt caching still beneficial (Anthropic supports it)
   - Fallback to GPT-4.1 provides cost-effective backup

## See Also
- [ADR-009: Single-Agent Claude Opus 4.5 Architecture](./ADR-009_single-agent-claude-architecture.md)
- `docs/06_ai_architecture.md` - Current architecture specification
