# Task 04: Client Corrective RAG Trace

## Goal

Render Corrective RAG metadata and source unions in the chat UI while preserving legacy message support.

## Scope

- Update client chat types.
- Add Corrective RAG trace rendering.
- Display document and web source badges/details.
- Keep existing Multi-Query and Self-RAG rendering for persisted older messages.

## Implementation Details

- Use `retrievalMetadata.strategy` to select the correct audit component.
- Render local/corrective/web attempts and final decision.
- Use URLs only for web sources; document chunks keep existing file/page display.

## Completion Criteria

- New `corrective_rag` messages render trace details.
- Old `multi_query` and `self_rag` messages remain readable.
- Text does not overflow compact trace/source cards.

## Test Cases

- Client lint.
- Client build.
- Manual inspection of type-driven UI branches where feasible.

## Review Gate

Stop for review unless the user has explicitly requested continuing through implementation.
