# Naive RAG Test Report

## Automated Verification

| Area | Command | Result | Notes |
| --- | --- | --- | --- |
| Server build | `npm run build` from `Naive_RAG/server` | Passed | Nest build completed successfully. |
| Server tests | `npm test -- --runInBand` from `Naive_RAG/server` | Passed | 11 test suites, 33 tests passed. |
| Client build | `npm run build` from `Naive_RAG/client` | Passed | Vite build completed successfully. Existing large-chunk warning remains. |

## Focused Task Verification

- Documents task previously passed `npm test -- documents --runInBand`.
- Chat task previously passed `npm test -- chat --runInBand`.
- Final full server test run passed all current tests.

## Runtime Service Checks

| Service | Check | Result |
| --- | --- | --- |
| Qdrant | `curl -fsS http://localhost:6333/collections` | Blocked: connection refused. |
| Ollama | `curl -fsS http://localhost:11434/api/tags` | Blocked: connection refused. |

## Manual Acceptance

Manual end-to-end RAG acceptance was not run in this environment because Qdrant and Ollama were not reachable on localhost.

Run these steps when Postgres, Qdrant, Ollama, server, and client are running:

1. Apply Drizzle migrations.
2. Confirm Ollama models are available:
   - `nomic-embed-text:v1.5`
   - `minimax-m2.5:cloud`
3. Register or log in through the client.
4. Upload a small `.txt` document from `/app/documents`.
5. Confirm the document appears in the documents table with a chunk count.
6. Ask an answerable question from `/app/chat`.
7. Confirm the answer and retrieved source chunks render.
8. Ask a question not present in the document.
9. Confirm the fallback answer: `I could not find this information in the uploaded document.`
10. Delete the uploaded document and confirm it disappears from the list.

## Known Limitations

- Ingestion is synchronous by design for learning clarity.
- PDF page numbers are only included when `pdf-parse` returns page-level text.
- The RAG module does not include LangGraph, agents, memory, hybrid search, reranking, streaming, or queues.
- Client build still emits the existing large-bundle warning; route-level code splitting remains future work.
