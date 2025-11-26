# ADR-008: GPT-5.1 Model Selection

## Status
**Accepted** - November 25, 2025

## Context

DatumPilot requires an AI model for two agents:
1. **Extraction Agent** - Parse GD&T Feature Control Frames from images/PDFs
2. **Explanation Agent** - Generate engineering-format explanations

Key requirements:
- **Multimodal capability** - Must parse technical drawings accurately
- **Instruction following** - Explanation Agent must never contradict deterministic calculations
- **Cost efficiency** - High-volume potential (10K-100K requests/month)
- **Structured output** - Must reliably produce valid JSON matching FcfJson schema

## Decision

Use **GPT-5.1** (released November 12-13, 2025) for both agents.

### Model Comparison

| Criterion | GPT-5.1 | Claude Sonnet 4.5 | Winner |
|-----------|---------|-------------------|--------|
| **Price (input)** | $1.25/1M tokens | $3.00/1M tokens | GPT-5.1 (2.4x cheaper) |
| **Price (output)** | $10.00/1M tokens | $15.00/1M tokens | GPT-5.1 (1.5x cheaper) |
| **Context window** | 400K tokens | 200K tokens | GPT-5.1 |
| **Prompt caching** | 24 hours | Available | GPT-5.1 |
| **Multimodal (MMMU)** | 84.2% | 77.8% | GPT-5.1 |
| **SWE-bench** | 74.9% | 77.2% | Claude Sonnet 4.5 |
| **Instruction following** | Excellent | Excellent | Tie |

### Key GPT-5.1 Features

1. **Extended Prompt Caching (24 hours)**
   - Cache GD&T symbol definitions
   - Cache ASME Y14.5-2018 extraction rules
   - Cache JSON schema for FCF output
   - **90% cost savings on cached tokens**

2. **Superior Multimodal Understanding**
   - 84.2% on MMMU benchmark (vs 77.8% for Claude Sonnet 4.5)
   - Critical for parsing technical drawings with GD&T symbols

3. **Adaptive Reasoning**
   - GPT-5.1 Instant for simple extractions
   - GPT-5.1 Thinking for complex FCFs (future option)

### Cost Projections

| Volume | Without Caching | With Caching |
|--------|-----------------|--------------|
| Per request | ~$0.008 | ~$0.003-0.005 |
| 10K/month | ~$80 | ~$30-50 |
| 100K/month | ~$800 | ~$300-500 |

Claude Sonnet 4.5 equivalent: ~$170/month (10K) or ~$1,700/month (100K)

## Consequences

### Positive
- **2-3x cost savings** compared to Claude Sonnet 4.5
- **Better multimodal accuracy** for technical drawing extraction
- **24-hour prompt caching** enables aggressive cost optimization
- **400K context** allows full ASME Y14.5 reference in prompts

### Negative
- **Vendor lock-in** to OpenAI (mitigated by clean abstraction layer)
- **Slightly lower SWE-bench** (not critical for our use case)

### Neutral
- Requires OpenAI API key and account
- Must implement prompt caching strategy to realize cost savings

## Model Variants

| Variant | Use Case | Status |
|---------|----------|--------|
| **gpt-5.1** | Both agents (recommended) | Primary |
| gpt-5.1-mini | Budget fallback for Explanation Agent | Optional |
| gpt-5.1-codex | Not needed (no heavy code generation) | Not used |

## Revisit Triggers

Re-evaluate model selection when:
- OpenAI releases GPT-5.2 or GPT-6
- Anthropic releases Claude Sonnet 5 with significantly better multimodal
- Google releases Gemini 3 with competitive pricing
- Extraction accuracy falls below 90% on production data

## References
- `docs/06_ai_architecture.md` - Full architecture specification
- OpenAI GPT-5.1 Announcement (November 12, 2025)
- Anthropic Claude Sonnet 4.5 Announcement (September 29, 2025)
