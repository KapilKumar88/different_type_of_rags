# Multi-Modal RAG Module Plan

## Module Purpose and Scope

Upgrade the text-only Naive RAG flow into a multi-modal RAG flow. The app now
ingests images (standalone uploads and images embedded inside PDFs/DOCX), embeds
them with CLIP into a separate Qdrant collection, fuses text and image retrieval
for a query, and generates answers with a vision LLM (`llama3.2-vision`) that
receives the actual retrieved image bytes.

## Status Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete

## Task Status

| Task | Status | Notes |
| --- | --- | --- |
| [Task 01](task_01.md) | [x] | Dependencies, config, and env for vision + CLIP + image collection. |
| [Task 02](task_02.md) | [x] | Parsing layer: image parser, PDF/DOCX image extraction, sharp normalization. |
| [Task 03](task_03.md) | [x] | CLIP embeddings service, vision service, Qdrant image collection methods. |
| [Task 04](task_04.md) | [x] | `document_images` table + `documents.image_count`, repository, migration, types. |
| [Task 05](task_05.md) | [x] | Ingestion + fused retrieval + vision routing + image-serving endpoint. |
| [Task 06](task_06.md) | [x] | Client: image uploads, modality-tagged sources, thumbnail rendering. |
| [Task 07](task_07.md) | [x] | Tests, server/client builds, documentation. |

## Key Technical Decisions

- **Dual-encoder, fused retrieval.** Text chunks stay on `nomic-embed-text`
  (768-dim) in the existing `documents` collection; images use a CLIP image
  encoder (512-dim) in a new `image_vectors` collection. Queries embed with both
  encoders and the results merge into one modality-tagged `RetrievedSource[]`.
  CLIP's weak, 77-token text encoder is intentionally not used for document text.
- **CLIP runs in-process** via `@huggingface/transformers` (ONNX), matching the
  existing in-process LangChain pattern. Model `Xenova/clip-vit-base-patch32`.
- **Vision generation.** When image sources are retrieved, generation routes to
  `VisionService` (Ollama `llama3.2-vision`) with the prompt plus base64 image
  blocks; otherwise it uses the existing text `LlmService`.
- **Image bytes live in Postgres** (`document_images.data` bytea), not in Qdrant
  payloads. They are served via an authenticated, ownership-checked endpoint and
  loaded from the repository for answer-time vision input.
- **`sharp`** normalizes every image (decode → flatten → downscale to a bounded
  edge → PNG) before storage and embedding.

## Workflow and Review Gate

- Apply the Drizzle migration before running with a real database.
- Run targeted documents/chat/parsing specs and the server build before marking
  complete.

## Completion Summary

Multi-modal ingestion, dual-encoder fused retrieval, and vision-grounded answer
generation are implemented end-to-end across server and client.

Verification:

- `npm run build` (server) and `npx jest --runInBand` (server, 17 suites / 101
  tests) passed.
- `npm run lint` and `npm run build` (client) passed (lint shows only
  pre-existing Fast Refresh warnings).
- Manual multi-modal acceptance requires Qdrant, a migrated Postgres, Ollama with
  `llama3.2-vision` pulled, and the first-run CLIP weight download.
</content>
