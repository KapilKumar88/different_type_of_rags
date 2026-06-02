# Task 02: Server Multi-Vector Indexing and Retrieval

## Goal

Add shared server services for representation generation, indexing, and fused retrieval.

## Scope

- Add typed config defaults.
- Extend RAG payload/source types.
- Add multi-vector service/module.
- Update Qdrant payload mapping and search compatibility.

## Implementation Details

- Generate summaries and hypothetical questions with `LlmService.generateAnswer`.
- Parse JSON responses with Zod and retry once on invalid output.
- Upsert one original point, one summary point, and configured question points per parent chunk.
- Retrieve by selected document IDs, dedupe by parent `chunkId`, and attach match debug metadata.

## Completion Criteria

- New upload indexing produces multiple Qdrant points per parent chunk.
- Retrieval returns fused parent chunks with match details.
- Legacy points without representation metadata still map correctly.

## Test Cases

- Representation parser success/failure/retry.
- Qdrant payload mapping for new and legacy points.
- Retrieval MaxSim dedupe and document scoping.

## Review Gate

Proceeding under the user's approved implementation request.
