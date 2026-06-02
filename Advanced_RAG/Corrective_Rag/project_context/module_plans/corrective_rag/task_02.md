# Task 02: Backend Types, Config, and Tavily Provider

## Goal

Add backend contracts needed by Corrective RAG before changing the chat path.

## Scope

- Add Corrective RAG metadata and source union types.
- Keep legacy Multi-Query and Self-RAG metadata types readable.
- Add typed Tavily and web-search config.
- Add an injectable Tavily web search service/module.

## Implementation Details

- Use `TAVILY_API_KEY`, `TAVILY_BASE_URL`, `RAG_WEB_SEARCH_MAX_RESULTS`, and `RAG_WEB_SEARCH_TIMEOUT_MS`.
- Use Node `fetch` with bearer auth and an abort timeout.
- Normalize provider output into bounded web source objects.
- Log sanitized provider failures through Nest `Logger`.

## Completion Criteria

- Server types compile.
- Tavily search gracefully returns unavailable/failed statuses when disabled or failing.
- No direct `process.env` reads outside typed config.

## Test Cases

- Env config default parsing.
- Tavily service success, missing key, provider failure, and malformed result cases.

## Review Gate

Stop for review unless the user has explicitly requested continuing through implementation.
