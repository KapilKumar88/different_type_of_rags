# Document Parsing Module Plan

## Module Purpose and Scope

Refactor document upload parsing into an injectable NestJS parsing module with one parser class per supported file family. The first implementation preserves current text-only behavior while making PDF, DOCX, and text-like parser classes the place to add richer future extraction.

## Status Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Complete

## Task Status

| Task | Status | Notes |
| --- | --- | --- |
| [Task 01](task_01.md) | [x] | Scope and parser contract defined from approved plan. |
| [Task 02](task_02.md) | [x] | Parsing module, parsers, service wiring, and upload validation integration implemented. |
| [Task 03](task_03.md) | [x] | Helper tests replaced with parsing tests; service and pipe tests updated. |
| [Task 04](task_04.md) | [x] | Project reference updated and verification completed. |

## Key Technical Decisions

- Keep upload API behavior unchanged: same supported extensions, MIME checks, content signature checks, and returned document metadata.
- Keep parser output text-only for this task: `ParsedDocument` contains pages with text and optional page numbers.
- Put extension/MIME registry logic in `DocumentParsingService`; parser classes own file-family parsing and signature checks.
- Convert upload validation into an injectable pipe so it can use `DocumentParsingService`.

## Workflow and Review Gate

- Complete tasks in order.
- Update this plan as each task progresses.
- Run targeted documents tests and server build before marking implementation complete.

## Completion Summary

Document parsing now lives behind `DocumentParsingService` and `DocumentParsingModule`. PDF, DOCX, and text-like file handling are split into parser classes, upload validation delegates to the parsing service, and document ingestion calls `parseDocument(...)`.

Verification:

- `npm test -- --runTestsByPath src/api/v1/documents/documents.service.spec.ts src/api/v1/documents/helpers/text-splitter.spec.ts src/api/v1/documents/parsing/document-parsing.service.spec.ts src/api/v1/documents/pipes/document-upload-validation.pipe.spec.ts --runInBand` passed.
- `npm run build` from `server/` passed.
- `npm test -- documents --runInBand` was also attempted, but this Jest invocation ran broader suites and failed in pre-existing dirty `auth.service.spec.ts` mocks missing `checkEmailExists`.
