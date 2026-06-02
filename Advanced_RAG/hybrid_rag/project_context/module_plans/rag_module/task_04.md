# Task 04: Documents API and Ingestion Flow

## Goal

Implement document upload, text extraction, chunking, embedding, Qdrant storage, document listing, and deletion.

## Scope

- Add `DocumentsModule`.
- Add documents controller, service, repository, DTO/types, and extraction helpers.
- Implement:
  - `POST /api/v1/documents/upload`
  - `GET /api/v1/documents`
  - `DELETE /api/v1/documents/:id`

## Implementation Details

- Use Nest multipart upload with memory storage.
- Accept `.txt`, `.md`, `.csv`, `.pdf`, and `.docx`.
- Reject missing files, empty extracted text, and unsupported extensions with clear HTTP errors.
- Extract text:
  - `.txt`, `.md`, `.csv`: decode buffer as UTF-8.
  - `.docx`: use DOCX extraction helper.
  - `.pdf`: use PDF extraction helper; include page numbers only if reliably available.
- Split extracted text using recursive character splitting:
  - chunk size `800`
  - chunk overlap `100`
- For each chunk:
  - Generate an embedding.
  - Store one Qdrant point.
  - Include payload fields `chunkId`, `documentId`, `fileName`, `text`, `pageNumber`, and `createdAt`.
- Save document metadata in Postgres after successful vector upsert.
- Delete flow must remove matching Qdrant points by `documentId` and delete Postgres metadata.
- Add short comments in the service explaining the Naive RAG ingestion steps.

## Completion Criteria

- Upload endpoint indexes a supported document synchronously.
- Documents list returns persisted metadata.
- Delete endpoint removes metadata and matching vector points.
- API responses follow `{ success, message, data }`.
- Controller logic remains thin; business logic lives in the service.

## Test Cases

- Run `npm run build` from `Naive_RAG/server`.
- Add unit tests for the splitter/extraction helper where practical.
- Add service tests with mocked embeddings and Qdrant for upload and delete behavior.
- Manually upload a small `.txt` file against local Qdrant/Ollama/Postgres when services are available.

## Review Gate

After completing this task, update `rag_module_plan.md`, then continue or stop according to the user's requested workflow.
