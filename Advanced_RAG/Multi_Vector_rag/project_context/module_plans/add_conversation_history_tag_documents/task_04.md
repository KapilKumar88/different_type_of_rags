# Task 04: Scoped Retrieval and No Document Overlap

## Goal

Guarantee that every conversation retrieves chunks only from the documents selected for that conversation.

## Scope

- Validate selected document IDs when creating a conversation.
- Add Qdrant filtered search by document IDs.
- Use scoped retrieval in the conversation answer flow.
- Keep global retrieval only for the legacy `/api/v1/chat/ask` endpoint.

## Implementation Details

- On conversation creation:
  - Deduplicate `documentIds`.
  - Reject an empty final document list.
  - Confirm every selected document exists in Postgres.
  - Return a validation error if any selected document ID is invalid or missing.
- Add a Qdrant service method for scoped search:
  - Inputs: vector, limit, document IDs.
  - Apply a Qdrant payload filter on `documentId`.
  - Return no chunks when `documentIds` is empty.
- Add a defensive in-memory filter after Qdrant search to drop any chunk whose `documentId` is not selected.
- Ensure selected document IDs are read from `conversation_documents`, not from the request body, when answering.

## Completion Criteria

- A conversation cannot be created with missing document IDs.
- A conversation cannot retrieve chunks from unselected documents.
- Legacy stateless chat keeps the existing unscoped behavior.
- Source chunks returned to the client always belong to selected conversation documents.

## Test Cases

- Run `npm run build` from `Naive_RAG/server`.
- Unit test that invalid selected documents are rejected.
- Unit test that duplicate selected document IDs are stored once.
- Unit test that Qdrant search receives the selected document filter.
- Unit test that out-of-scope chunks are dropped before prompting.

## Review Gate

After completing this task, update the lookup file, then stop unless the user explicitly approves Task 05.
