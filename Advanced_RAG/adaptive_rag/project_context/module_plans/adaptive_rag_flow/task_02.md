# Task 02: Adaptive RAG Contracts and Persistence

## Goal

Add the typed contracts, configuration, and persistence support needed for adaptive response metadata.

## Scope

- Define server-side Adaptive RAG types for decisions, retrieval attempts, graded sources, answer checks, and response trace.
- Extend persisted assistant messages to store an optional adaptive trace.
- Add any required Drizzle schema and migration changes.
- Add typed config values for adaptive thresholds and attempt limits.
- Update existing server tests that construct `ConversationMessage` objects.

## Implementation Details

- Add a focused shared type file, likely under `server/src/types/`.
- Extend `conversation_messages` with an optional JSONB column for adaptive trace data.
- Keep JSONB nullable so existing user and assistant messages remain valid.
- Add config through `server/src/config/env.ts` and `server/src/config/rag.config.ts`; do not access `process.env` directly in feature code.
- Conservative default values:
  - Max retrieval attempts: initial query plus one rewrite.
  - Minimum vector score threshold for weak retrieval detection.
  - Maximum graded context count bounded by existing `RAG_TOP_K`.
- Update repository create/find types without introducing `any`.

## Completion Criteria

- Server builds with strict TypeScript.
- Existing chat tests compile with the new message shape.
- Database migration exists for the adaptive trace column.
- Module plan task status and notes are updated.

## Test Cases

- `npm run build` from `server/`.
- Focused schema/repository-adjacent tests where applicable.
- Existing chat service/controller tests compile after fixture updates.

## Review Gate

Stop after Task 02 and ask the user for review before runtime orchestration work.

## Completion Notes

- Added `server/src/types/adaptive-rag.types.ts` for adaptive route, fallback, retrieval attempt, source grade, answer check, and trace contracts.
- Added nullable `conversation_messages.adaptive_trace` JSONB persistence through the Drizzle schema and migration `0004_adaptive_rag_trace.sql`.
- Added typed adaptive config values through `env.ts` and `rag.config.ts`.
- Verified:
  - `npm test -- chat.service.spec.ts chat.controller.spec.ts env.spec.ts --runInBand`
  - `npm run build`
