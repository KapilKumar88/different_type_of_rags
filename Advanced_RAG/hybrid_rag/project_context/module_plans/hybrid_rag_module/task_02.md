# Task 02: Sparse Vectorizer and Qdrant Support

## Goal

Add deterministic sparse vectors and Qdrant support for named sparse vector storage.

## Scope

- Add a sparse vectorizer service.
- Ensure new Qdrant collections include dense and sparse vector configs.
- Add `text_sparse` to existing Qdrant collections in place.
- Ensure a `documentId` payload index exists.
- Add sparse vector update support for newly uploaded chunks.

## Implementation Details

- Tokenize natural text and code-style identifiers.
- Stable-hash tokens to sparse indices.
- Aggregate term-frequency weights.
- Cap features by configured max.
- Use Qdrant `modifier: "idf"` for sparse vectors.
- Keep dense upsert first, then update named sparse vectors.

## Completion Criteria

- New uploads write dense vectors and sparse vectors.
- Sparse update failure after dense upsert triggers Qdrant cleanup before metadata persistence.
- Existing dense-only points remain valid.

## Test Cases

- Sparse vectorizer determinism, tokenization, cap, and empty input.
- Qdrant collection creation/update includes sparse config and payload index.
- Documents upload compensates sparse update failures.

## Review Gate

Stop for review after this task unless the user explicitly requested full implementation in one run.
