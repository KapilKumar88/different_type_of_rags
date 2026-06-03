# Task 01: Dependencies, Config, and Env

## Goal

Add the runtime dependencies and typed configuration needed for image
understanding, CLIP embeddings, and a separate image vector collection.

## Implementation Details

- Add `@huggingface/transformers` (CLIP, ONNX, in-process) and `sharp` (image
  decode/normalize/thumbnail) to `server`.
- Extend `server/src/config/env.ts` Zod schema and `.env.example` with:
  `OLLAMA_VISION_MODEL` (default `llama3.2-vision`), `CLIP_MODEL` (default
  `Xenova/clip-vit-base-patch32`), `QDRANT_IMAGE_COLLECTION` (default
  `image_vectors`), `QDRANT_IMAGE_VECTOR_SIZE` (default `512`), `RAG_IMAGE_TOP_K`
  (default `3`).
- Surface them through `ollama.config.ts`, `qdrant.config.ts`, `rag.config.ts`,
  and a new `clip.config.ts`.
- Add image extensions/MIME types and image limits (`maxImageCount`,
  `maxImageBytes`, `minExtractedImagePx`, `maxImageEdgePx`) to
  `document-upload.config.ts`.

## Completion Criteria

- New env vars validate with sane defaults; config modules expose them.
- Image extensions `.png/.jpg/.jpeg/.webp` are recognized as supported uploads.

## Review Gate

Server build passes with the new config wiring.
