# Task 06: Docs and Verification

## Goal

Mark Multi-Hop RAG as done in `RagTypes.md`, update `MASTER_PROJECT_REFERENCE.md` with the new module state, run all verification commands, and finalize the module plan.

## Scope

- `../../RagTypes.md` — mark Multi-Hop RAG as Done.
- `project_context/MASTER_PROJECT_REFERENCE.md` — add Multi-Hop RAG module state, new env vars, new API contracts, new SSE event types, pitfalls.
- `project_context/module_plans/multi_hop_rag_module/multi_hop_rag_module_plan.md` — update all tasks to Approved.

## Implementation Details

### RagTypes.md

Change:
```
| Multi-Hop RAG         | Finds answers across multiple chunks/documents |
```
To:
```
| Multi-Hop RAG         | Finds answers across multiple chunks/documents (Done) |
```

### MASTER_PROJECT_REFERENCE.md additions

Add a **Multi-Hop RAG Module Current State** section covering:
- New env vars and defaults (`RAG_MULTI_HOP_ENABLED`, etc.).
- New SSE event type: `hops` — emitted after `sources`, carries `{ hops: MultiHopStep[] }`.
- New `metadata` jsonb column on `conversation_messages`.
- New service: `MultiHopRetrieverService` under `server/src/services/rag-runtime/`.
- Frontend: `ReasoningTrace` collapsible in `message-display.tsx`.
- Migration: `0004_*.sql` adds `metadata` column.

Add to **Pitfalls & Lessons Learned**:
- Multi-hop prompts must treat question and evidence text as untrusted content.
- Decomposition fallback to `[question]` ensures the feature never regresses below naive.
- The `hops` event is emitted even when multi-hop is disabled (empty array) so clients need not special-case it.

## Completion Criteria

- `RagTypes.md` marks Multi-Hop RAG as Done.
- `MASTER_PROJECT_REFERENCE.md` reflects the new module state and config.
- Module plan shows all tasks Approved.
- All verification commands pass.

## Verification Commands

```bash
# Server
cd server
npm run build
npm test -- --runInBand
npm run db:generate  # should report no new changes

# Client
cd client
npm run build
npm run lint
```

## Review Gate

After completing this task, the Multi-Hop RAG module is complete.
