# Task 04: Chat Module Decomposition

## Goal

Break the 1561-line `src/routes/app.chat.tsx` route into smaller feature files so future optimization and testing can happen safely.

## Scope

- Extract chat-specific components, hooks, and helpers under a feature-focused location.
- Preserve current UI and behavior.
- Keep the route file focused on composition and page orchestration.

## Implementation Details

- Candidate extraction targets:
  - Conversation list and list item components.
  - Conversation header and document scope components.
  - Message row, source chunks, markdown rendering wrapper, and skeletons.
  - New conversation and edit scope dialogs.
  - Chat formatting/title helper functions.
  - Streaming orchestration into a focused hook if it can be done without behavior churn.
- Maintain import direction from the client architecture guide.
- Keep types in `src/types` or feature-local files when they are only local.

## Completion Criteria

- `app.chat.tsx` is substantially smaller and mainly composes extracted units.
- No behavior changes to create/select/rename/delete/scope/edit/stream/retry flows.
- Extracted files are named by responsibility.

## Test Cases

- Run `npm run lint` from `client/`.
- Run `npm run build` from `client/`.
- Manually verify chat flows with a running backend when available.

## Review Gate

Stop after this task and wait for user review before starting Task 05.
