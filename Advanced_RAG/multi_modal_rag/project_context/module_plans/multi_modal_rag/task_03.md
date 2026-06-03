# Task 03: CLIP, Vision, and Qdrant Image Collection

## Goal

Add the shared services that embed images/queries with CLIP, generate
vision-grounded answers, and store/search image vectors.

## Implementation Details

- `services/clip-embeddings/`: `ClipEmbeddingsService` lazily loads Transformers.js
  CLIP text + vision encoders; `embedText(query)` and `embedImage(buffer)` return
  L2-normalized vectors sized to `qdrantConfig.imageVectorSize`. Images are decoded
  with `sharp` into a `RawImage` before the processor runs.
- `services/vision/`: `VisionService` wraps `ChatOllama` on `ollamaConfig.visionModel`;
  `streamAnswer(prompt, images)` sends mixed text + `image_url` base64 blocks, and
  `describeImage(image)` returns a best-effort caption.
- `services/qdrant/qdrant.service.ts`: generalize collection ensure/upsert/search/
  delete and add `upsertImagePoints`, `searchImagesByDocumentIds`,
  `deleteImagesByDocumentId` against the image collection.

## Completion Criteria

- Image and text queries embed into the same CLIP space; image points upsert,
  search (document-scoped), and delete correctly.

## Review Gate

Server build and Qdrant service spec pass.
