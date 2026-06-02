# Task 03: Tests

## Goal

Replace helper tests with parser service tests and update existing documents tests for the injected parser service.

## Scope

- Add parsing service/parser unit tests.
- Update documents service tests to mock `DocumentParsingService`.
- Update validation pipe tests to mock `DocumentParsingService`.

## Implementation Details

- Cover supported extensions, unsupported extensions, MIME mismatch, content signature mismatch, null bytes, plain text parsing, and invalid PDF/DOCX parse failures.
- Add coverage that page numbers still flow to vector payloads.

## Completion Criteria

- `npm test -- documents --runInBand` passes.

## Test Cases

- Targeted documents Jest suite.

## Review Gate

Test updates must prove the refactor did not change upload behavior.
