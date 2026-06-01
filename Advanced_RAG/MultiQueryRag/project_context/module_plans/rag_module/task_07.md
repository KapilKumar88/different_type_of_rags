# Task 07: Client Chat Integration

## Goal

Replace mock chat behavior with the real Naive RAG chat API.

## Scope

- Add chat types.
- Add chat service.
- Update chat page send flow.
- Render retrieved source chunks.

## Implementation Details

- Add `src/types/chat.types.ts`.
- Add `src/services/chat.service.ts`.
- Extend `api.config.ts` with chat endpoints.
- Update `app.chat.tsx` to:
  - Remove mock messages and timeout-based answer generation.
  - Submit questions to `/api/v1/chat/ask`.
  - Disable send while a request is pending.
  - Render answer text with existing markdown component.
  - Render source chunks under assistant messages with file name, page number when available, similarity score, and chunk text.
- Keep the UI simple and focused on learning the retrieved-context flow.

## Completion Criteria

- Chat page no longer depends on mock assistant responses.
- Each assistant message can display retrieved source chunks.
- Backend errors are shown as toasts and do not break the chat UI.
- The existing chat layout remains usable on desktop and mobile.

## Test Cases

- Run `npm run build` from `Naive_RAG/client`.
- Ask a question when documents exist and confirm answer plus source chunks render.
- Ask when no relevant chunks exist and confirm fallback answer renders.

## Review Gate

After completing this task, update `rag_module_plan.md`, then continue or stop according to the user's requested workflow.
