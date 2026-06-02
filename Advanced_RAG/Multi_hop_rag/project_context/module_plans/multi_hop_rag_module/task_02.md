# Task 02: MultiHopRetrieverService and Spec

## Goal

Create the multi-hop retrieval orchestrator service and its unit test suite.

## Scope

- `server/src/services/rag-runtime/multi-hop-retriever.service.ts` — new service.
- `server/src/services/rag-runtime/multi-hop-retriever.service.spec.ts` — unit tests.
- No changes to existing files in this task.

## Implementation Details

### Service class structure

```ts
@Injectable()
export class MultiHopRetrieverService {
  constructor(
    private readonly embeddingsService: EmbeddingsService,
    private readonly qdrantService: QdrantService,
    private readonly llmService: LlmService,
    private readonly ragConcurrencyLimiter: RagConcurrencyLimiterService,
  ) {}

  async retrieve(question: string, documentIds: string[]): Promise<MultiHopResult>
}
```

### Algorithm in retrieve()

1. **Decompose** — call `decompose(question)` → string[].
   - Prompt the LLM to return a JSON array of 1–`maxSubQuestions` standalone sub-questions.
   - Parse via `extractJsonArray(raw)` — strips ``` fences, calls `JSON.parse`, validates string[].
   - On any parse failure or empty array → fall back to `[question]`.

2. **Iterative hop loop** (bounded by `maxHops`):
   - Maintain `accumulated: Map<string, RetrievedChunk>` keyed by `chunkId`.
   - Seed a `queryQueue: Array<{ query: string; kind: MultiHopStepKind }>` with sub-questions (kind `sub-question`).
   - Loop while `queryQueue.length > 0 && hopNumber < maxHops`:
     - Dequeue the next query.
     - `embed` via concurrency limiter key `'embedding'`.
     - `search` via concurrency limiter key `'qdrant-search'` (perHopTopK).
     - Compute new chunks (not yet in accumulator); add to accumulator.
     - Push `MultiHopStep` to `hops[]`.
     - If newChunkCount === 0, break (no new evidence).
   - When the seeded queue empties but hops remain, call `generateFollowUp(question, accumulated)`:
     - Prompt the LLM: given original question + a compact evidence summary (first 120 chars per chunk, up to 5 chunks), reply with ONE follow-up query or the literal word `DONE`.
     - If not `DONE` and not already queued/retrieved, enqueue with kind `follow-up`.
     - Otherwise break.

3. **Finalize** — sort `accumulated` values by `score` desc, cap at `maxContextChunks`, return `{ sources, hops }`.

### Prompt strings (inline, no external files)

Decompose prompt template:
```
You are a research assistant. Break the following question into {maxSubQuestions} or fewer standalone sub-questions that together cover all information needed to answer it.
Return ONLY a JSON array of strings, e.g. ["sub-question 1", "sub-question 2"].
Do not add explanation.

Question: {question}
```

Follow-up prompt template:
```
You are a research assistant. The original question is: {question}

Evidence gathered so far (partial, may be incomplete):
{evidenceSummary}

Based on the original question and the evidence above, generate ONE follow-up search query that would retrieve the missing information needed to fully answer the question.
If you have enough evidence to answer the question, reply with exactly: DONE

Reply with only the search query or DONE.
```

Both prompts treat their data as content, not instructions (mirrors `chat.service.ts` style).

### Unit spec coverage

- Decomposition fallback: when LLM returns garbage, `retrieve` still works using `[question]`.
- Cross-hop dedupe: the same `chunkId` appearing in two hops is counted once in sources.
- `maxHops` cap: loop stops at `maxHops` even when follow-ups keep arriving.
- `DONE` stop: LLM returning `DONE` ends the loop early.
- Zero-new-chunks stop: a hop that adds no new chunks stops the loop.
- Final cap: more than `maxContextChunks` accumulated chunks are trimmed to `maxContextChunks`.

## Completion Criteria

- Service compiles with no TypeScript errors (no `any`, strict mode compatible).
- All six spec cases pass with mocked dependencies.
- `npm run build` from `server/` passes.
- `npm test -- multi-hop-retriever.service.spec.ts --runInBand` passes.

## Test Cases

- Run `npm test -- multi-hop-retriever.service.spec.ts --runInBand` from `server/`.
- Run `npm run build` from `server/`.

## Review Gate

After completing this task, update `multi_hop_rag_module_plan.md` task status to `Review`, then stop and wait for user approval before starting Task 03.
