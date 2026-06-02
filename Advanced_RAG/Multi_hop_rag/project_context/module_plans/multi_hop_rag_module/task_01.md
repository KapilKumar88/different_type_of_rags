# Task 01: Types and Config

## Goal

Add the new shared types for multi-hop retrieval and extend the RAG config and env parsing to support multi-hop settings.

## Scope

- `server/src/types/rag.types.ts` — add `MultiHopStepKind`, `MultiHopStep`, `MultiHopResult`.
- `server/src/config/env.ts` — add five new env vars with safe defaults.
- `server/src/config/rag.config.ts` — add `multiHop` config block derived from the new env vars.
- `server/.env.example` — document the new env vars.

## Implementation Details

### rag.types.ts additions

```ts
export type MultiHopStepKind = 'sub-question' | 'follow-up';

export type MultiHopStep = {
  hopNumber: number;
  kind: MultiHopStepKind;
  query: string;
  retrievedChunkIds: string[];
  newChunkCount: number;
};

export type MultiHopResult = {
  sources: RetrievedChunk[];
  hops: MultiHopStep[];
};
```

### env.ts additions (inside envSchema object)

```ts
RAG_MULTI_HOP_ENABLED: z.coerce.boolean().default(true),
RAG_MULTI_HOP_MAX_HOPS: z.coerce.number().int().positive().default(4),
RAG_MULTI_HOP_MAX_SUBQUESTIONS: z.coerce.number().int().positive().default(3),
RAG_MULTI_HOP_PER_HOP_TOP_K: z.coerce.number().int().positive().default(4),
RAG_MULTI_HOP_MAX_CONTEXT_CHUNKS: z.coerce.number().int().positive().default(8),
```

### rag.config.ts additions

```ts
multiHop: {
  enabled: env.RAG_MULTI_HOP_ENABLED,
  maxHops: env.RAG_MULTI_HOP_MAX_HOPS,
  maxSubQuestions: env.RAG_MULTI_HOP_MAX_SUBQUESTIONS,
  perHopTopK: env.RAG_MULTI_HOP_PER_HOP_TOP_K,
  maxContextChunks: env.RAG_MULTI_HOP_MAX_CONTEXT_CHUNKS,
},
```

### .env.example additions

```
# Multi-Hop RAG
RAG_MULTI_HOP_ENABLED=true
RAG_MULTI_HOP_MAX_HOPS=4
RAG_MULTI_HOP_MAX_SUBQUESTIONS=3
RAG_MULTI_HOP_PER_HOP_TOP_K=4
RAG_MULTI_HOP_MAX_CONTEXT_CHUNKS=8
```

## Completion Criteria

- `rag.types.ts` exports `MultiHopStepKind`, `MultiHopStep`, `MultiHopResult`.
- `env.ts` parses all five new vars with sane defaults; existing env test still passes.
- `rag.config.ts` exposes `ragConfig.multiHop.*`.
- `.env.example` documents the five new vars.
- `npm run build` from `server/` passes.
- `npm test -- env.spec.ts --runInBand` passes.

## Test Cases

- Run `npm run build` from `server/`.
- Run `npm test -- env.spec.ts --runInBand` from `server/`.
- Confirm no service or controller files are touched in this task.

## Review Gate

After completing this task, update `multi_hop_rag_module_plan.md` task status to `Review`, then stop and wait for user approval before starting Task 02.
