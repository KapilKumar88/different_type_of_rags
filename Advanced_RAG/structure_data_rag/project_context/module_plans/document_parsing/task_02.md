# Task 02: Parsing Module Refactor

## Goal

Add the parsing module and update document upload flow to call the injectable parsing service.

## Scope

- Create parsing types, parser classes, parsing module, and parsing facade service.
- Wire `DocumentsModule`, `DocumentsService`, upload controller, validation pipe, and text splitter.
- Remove old helper usage.

## Implementation Details

- `PlainTextDocumentParser` handles `.txt`, `.md`, and `.csv`.
- `PdfDocumentParser` keeps `pdf-parse` text extraction and page numbers.
- `DocxDocumentParser` keeps `mammoth.extractRawText`.
- `DocumentUploadValidationPipe` becomes injectable and delegates file type validation to `DocumentParsingService`.

## Completion Criteria

- No runtime imports remain from `helpers/text-extractor`.
- Upload behavior remains unchanged.

## Test Cases

- Covered in Task 03.

## Review Gate

Implementation should preserve current API behavior and prepare future parser-specific expansion.
