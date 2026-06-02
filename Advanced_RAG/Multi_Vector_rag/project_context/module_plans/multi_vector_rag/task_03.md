# Task 03: API Flow and Client Source Debug UI

## Goal

Wire multi-vector services into existing document upload and chat streaming flows, and display source debug metadata on the client.

## Scope

- Replace direct document embedding/upsert orchestration with multi-vector indexing service.
- Replace direct chat Qdrant search orchestration with multi-vector retrieval service.
- Extend client source types and source panels.

## Implementation Details

- Keep prompt context as parent chunk text only.
- Persist assistant message sources with additive debug metadata.
- Show best match type, fused score, per-match scores, and representation text in the source UI.

## Completion Criteria

- Existing endpoints continue to work.
- Source UI renders legacy and multi-vector sources without duplicate keys.

## Test Cases

- Chat streams and persists fused sources.
- Prompt excludes generated representation text from retrieved context.
- Client lint/build pass.

## Review Gate

Proceeding under the user's approved implementation request.
