# Task 03: Parser Extraction

## Goal

Extend document parsing so uploads can return both text pages and structured tables.

## Scope

- CSV table extraction.
- XLSX workbook/sheet table extraction.
- JSON object/array table extraction.
- Markdown table extraction.
- DOCX table extraction.
- PDF table extraction through `pdf-parse` `getTable()`.

## Implementation Details

- Normalize every table to typed columns and rows.
- Infer column value types conservatively: string, number, boolean, date, or empty.
- Preserve source metadata such as page number, sheet name, or JSON path.
- Keep existing text extraction behavior.

## Completion Criteria

- Parser output includes `pages` and `structuredTables`.
- Existing text-only document tests continue to pass.

## Test Cases

- Parser unit tests for CSV, XLSX, JSON, Markdown, DOCX, and PDF table extraction.
- Tests for malformed or empty structured uploads.

## Review Gate

Stop after parser extraction review.
