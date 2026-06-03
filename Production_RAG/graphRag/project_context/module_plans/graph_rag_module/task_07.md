# Task 07: Client Graph Visualization Page

## Goal
Add a `/app/graph` route that lets users pick a document and view its knowledge graph as an interactive force-directed visualization.

## Scope
- Install `react-force-graph-2d`.
- `client/src/types/graph.types.ts` — client graph types.
- `client/src/config/api.config.ts` — add `graph.documentGraph(id)` endpoint.
- `client/src/services/graph.service.ts` — fetches graph data.
- `client/src/routes/app.graph.tsx` — the page component.
- `client/src/main.tsx` — add lazy route `/app/graph`.
- `client/src/components/app/app-sidebar.tsx` (or equivalent) — add sidebar nav link.
- `client/vite.config.ts` — add `vendor-graph` manual chunk for `react-force-graph-2d`.

## Implementation Details

### graph.types.ts (client)
```ts
export type GraphNode = { id: string; name: string; type: string; description: string; documentId: string };
export type GraphEdge = { id: string; sourceId: string; targetId: string; type: string; description: string; documentId: string };
export type DocumentGraph = { nodes: GraphNode[]; edges: GraphEdge[] };
export type DocumentGraphResponse = { success: true; message: string; data: { graph: DocumentGraph } };
```

### GraphVisualization page
- TanStack Query `useQuery` for document list (reuse existing endpoint).
- A select/dropdown of owned documents.
- On selection, `useQuery` for `GET /api/v1/graph/documents/:id`.
- Render `ForceGraph2D` from `react-force-graph-2d`:
  - Nodes colored by entity `type` (a small deterministic color map).
  - Edge labels show relationship `type`.
  - Click/hover shows a tooltip with `name` + `description`.
- Empty state: "No knowledge graph found for this document" if `nodes.length === 0`.
- Loading skeleton while fetching.

### vite.config.ts vendor chunk
```ts
'vendor-graph': ['react-force-graph-2d']
```

## Completion Criteria
- `npm run build` from `client/` passes; `vendor-graph` chunk appears.
- `npm run lint` passes.
- Page renders at `/app/graph` without errors.

## Review Gate
Stop here. Wait for approval before Task 08.
