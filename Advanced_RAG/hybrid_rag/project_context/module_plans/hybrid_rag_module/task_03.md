# Task 03: Hybrid Retrieval Flow

## Goal

Replace dense-only chat retrieval with scoped dense+sparse retrieval and local weighted RRF fusion.

## Scope

- Add a shared hybrid retriever service.
- Search dense and sparse Qdrant channels inside selected document scope.
- Fuse candidate lists locally.
- Return top `RAG_TOP_K` fused chunks with diagnostics.

## Implementation Details

- Dense candidates keep Qdrant cosine scores and dense ranks.
- Sparse candidates keep Qdrant keyword scores and sparse ranks.
- Fused score uses weighted RRF with configured `k`.
- Retrieval mode is `dense`, `sparse`, or `hybrid`.

## Completion Criteria

- Chat streams emit diagnostic source payloads.
- Prompt construction and fallback behavior remain unchanged.
- Conversation ownership and selected document scoping are preserved.

## Test Cases

- Dense-only, sparse-only, and hybrid ranking.
- Selected document filter is passed to both retrieval channels.
- Stream error behavior remains stable.

## Review Gate

Stop for review after this task unless the user explicitly requested full implementation in one run.
