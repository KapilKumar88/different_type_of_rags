# Task 05: Ingestion, Retrieval, Generation, Endpoint

## Goal

Wire the multi-modal pipeline through document ingestion and chat answering.

## Implementation Details

- `documents.service.ts`: allow image-only documents; create the document row
  first (FK), then index text (nomic → `documents`) and images (best-effort
  caption → persist bytes → CLIP embed → `image_vectors`). Unified compensation
  deletes the document (cascading image rows) and both Qdrant collections. Delete
  also clears image vectors.
- `documents.controller.ts`: `GET /api/v1/documents/images/:imageId`,
  JWT + ownership-checked, streams bytes with `Content-Type`/cache headers.
- `chat.service.ts`: `retrieveConversationSources` runs nomic text search and
  CLIP image search (scoped to conversation documents) and merges into
  `RetrievedSource[]`. The prompt includes text chunks and image captions;
  generation routes to `VisionService` when image sources exist (loading bytes via
  `DocumentsService.getImagesForUser`), else `LlmService`. SSE `sources` and the
  persisted message carry modality-tagged sources with `imageId`.

## Completion Criteria

- Image-only and mixed uploads index correctly; queries retrieve text + images;
  answers with images route through the vision model.

## Review Gate

`documents.service.spec.ts`, `chat.service.spec.ts`, and
`documents.controller.spec.ts` pass.
