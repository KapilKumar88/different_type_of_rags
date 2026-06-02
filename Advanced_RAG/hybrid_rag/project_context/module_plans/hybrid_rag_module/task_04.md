# Task 04: Client Diagnostics

## Goal

Show detailed retrieval diagnostics in chat source chunks without breaking old conversations.

## Scope

- Extend client source types with optional diagnostics.
- Update source badges/details to show fused, dense, and sparse values.
- Keep old source payloads rendering with sensible fallbacks.

## Implementation Details

- Treat diagnostic fields as optional.
- Use compact wrapping layouts for mobile and desktop.
- Avoid changing chat service endpoints or stream handling.

## Completion Criteria

- New source payloads show retrieval mode, fused score, dense/sparse scores, and ranks.
- Old source payloads with only `score` still render.
- Text does not overflow source badges/details.

## Test Cases

- Client build and lint pass.
- Manual visual smoke can confirm diagnostics wrap cleanly.

## Review Gate

Stop for review after this task unless the user explicitly requested full implementation in one run.
