# Task 09: Verification and Context Update

## Goal
Verify all tasks end-to-end, then update MASTER_PROJECT_REFERENCE.md to reflect the Graph RAG state.

## Scope
- Run server build + full test suite.
- Run client build + lint.
- Manual smoke test checklist (requires Neo4j + Ollama + Postgres running locally).
- Update `project_context/MASTER_PROJECT_REFERENCE.md`.
- Update `graph_rag_module_plan.md` task statuses.

## Verification Commands

### Server
```bash
cd server
npm run build
npm test -- --runInBand
npm test -- graph --runInBand
```

### Client
```bash
cd client
npm run lint
npm run build
```

## Manual Smoke Test Checklist
- [ ] Neo4j running: `docker run -d --name neo4j-graphrag -p 7474:7474 -p 7687:7687 -e NEO4J_AUTH=neo4j/password neo4j:5`
- [ ] Ollama + Postgres running; migrations applied.
- [ ] Upload a document → server logs show graph extraction; Neo4j has nodes/edges.
- [ ] Open `/app/graph`, pick the document → force-directed graph renders.
- [ ] Start a conversation, send a question → answer streams; "Knowledge graph used" panel shows entities/relationships.
- [ ] Delete the document → Neo4j nodes/edges gone (`MATCH (n {documentId: $id}) RETURN count(n)`).

## MASTER_PROJECT_REFERENCE.md Updates
- Add Graph RAG module to Server Current Map.
- Document new env vars (NEO4J_*, GRAPH_*).
- Document removed vars (QDRANT_*, OLLAMA_EMBEDDING_MODEL).
- Add new API endpoint `GET /api/v1/graph/documents/:id`.
- Add new SSE event `graph`.
- Document `graphContext` column on `conversation_messages`.
- Add pitfalls/lessons learned.
- Add Quick Verification Snapshot entry.

## Review Gate
Final task. After approval, the module is complete.
