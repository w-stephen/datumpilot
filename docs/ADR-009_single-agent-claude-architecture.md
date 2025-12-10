# ADR-009: Single-Agent Claude Opus 4.5 Architecture

## Status
**Accepted** - December 2025

## Context

DatumPilot v1 scope was revised to remove Mode 1 (image interpretation), which eliminated the need for the Extraction Agent. This ADR documents the simplified single-agent architecture with provider abstraction.

### What Changed
- **Mode 1 removed**: Image/PDF upload and extraction out of v1 scope
- **Extraction Agent removed**: No longer needed without image interpretation
- **Model changed**: Claude Opus 4.5 replaces GPT-5.1 as primary
- **Fallback added**: OpenAI GPT-4.1 as backup provider

### Superseded ADRs
- [ADR-007](./ADR-007_2-agent-architecture.md): 2-Agent Architecture
- [ADR-008](./ADR-008_gpt-5.1-model-selection.md): GPT-5.1 Model Selection

## Decision

### Single-Agent Architecture

| Agent | Purpose | Model | Fallback |
|-------|---------|-------|----------|
| **Explanation Agent** | Generate engineering-format explanation | Claude Opus 4.5 | GPT-4.1 |

### Authority Model
```
User Input (Builder/JSON) → [Rules Engine: AUTHORITATIVE]
                                    ↓
                             [Calc Engine: AUTHORITATIVE]
                                    ↓
                             [Explanation Agent: Informational]
```

The deterministic core remains **authoritative**. The AI agent generates educational explanations but cannot override validation results or calculations.

### Provider Abstraction Layer

```typescript
// lib/ai/providers/
interface AIProvider {
  generateExplanation(input: ExplanationInput): Promise<ExplanationResult>;
}

// Automatic fallback on failure
const result = await aiOrchestrator.explain(input);
// 1. Try Claude Opus 4.5
// 2. On failure, try GPT-4.1
// 3. On failure, return error with fallback attempted
```

### Model Selection: Claude Opus 4.5

| Criterion | Claude Opus 4.5 | GPT-4.1 | Winner |
|-----------|-----------------|---------|--------|
| **Instruction following** | Excellent | Excellent | Tie |
| **Engineering explanations** | Superior | Good | Claude |
| **Prompt caching** | Available (5-min TTL) | Available (24-hr TTL) | GPT-4.1 |
| **Output consistency** | Very consistent | Consistent | Claude |
| **Integration stability** | Stable | Stable | Tie |

Claude Opus 4.5 chosen as primary because:
1. Superior quality for educational engineering explanations
2. Better at respecting authoritative numbers in prompts
3. More nuanced explanations of GD&T concepts
4. Anthropic alignment with DatumPilot's accuracy-first approach

### Prompt Caching Strategy

```typescript
// Cached content (GDT reference, ~8K tokens)
const cachedSystemPrompt = `
You are a GD&T expert assistant...
[ASME Y14.5-2018 symbol definitions]
[Tolerance calculation reference]
`;

// Dynamic content per request
const userPrompt = `
Explain this FCF: ${JSON.stringify(fcfJson)}
Calculation result: ${JSON.stringify(calcResult)}
`;
```

With Anthropic prompt caching:
- System prompt cached for 5 minutes
- 90% cost reduction on cached tokens
- Automatic cache invalidation on prompt changes

### Fallback Strategy

```typescript
async function explainWithFallback(input: ExplanationInput): Promise<ExplanationResult> {
  try {
    return await claudeProvider.generateExplanation(input);
  } catch (claudeError) {
    logger.warn('Claude failed, trying OpenAI fallback', { error: claudeError });
    try {
      return await openaiProvider.generateExplanation(input);
    } catch (openaiError) {
      logger.error('Both providers failed', { claudeError, openaiError });
      throw new AIServiceError('All AI providers unavailable');
    }
  }
}
```

### AI Response Metadata

All AI responses include metadata for observability:

```typescript
interface AIMetadata {
  provider: 'anthropic' | 'openai';
  model: string;
  promptCacheStatus: 'hit' | 'miss' | 'none';
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  correlationId: string;
}
```

## Consequences

### Positive
- **Simpler architecture**: 1 agent vs 2 agents
- **Higher quality explanations**: Claude Opus 4.5 excels at educational content
- **Provider redundancy**: Automatic fallback prevents total AI failures
- **Lower cost**: Explanation-only workload (no extraction) + prompt caching
- **Easier testing**: Single agent with deterministic inputs

### Negative
- **No image extraction in v1**: Users must use builder or JSON input
- **Provider costs**: Claude Opus 4.5 more expensive than GPT-4.1 per token

### Neutral
- Confidence now derived from `validationClean` only (no `parseConfidence`)
- Future Mode 1 implementation would require re-adding Extraction Agent

## Configuration

```bash
# Environment variables
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
AI_PRIMARY_PROVIDER=anthropic   # or "openai"
AI_FALLBACK_PROVIDER=openai     # or "anthropic" or "none"
```

## Revisit Triggers

Re-evaluate this decision when:
- Mode 1 (image interpretation) is added to scope
- Anthropic releases Claude Opus 5 with different characteristics
- OpenAI releases GPT-5 with significantly better explanation quality
- Cost profile changes significantly
- Provider reliability issues emerge

## References
- `docs/06_ai_architecture.md` - Full architecture specification
- `lib/ai/providers/` - Provider abstraction implementation
- [ADR-007](./ADR-007_2-agent-architecture.md) - Superseded 2-agent architecture
- [ADR-008](./ADR-008_gpt-5.1-model-selection.md) - Superseded GPT-5.1 selection
