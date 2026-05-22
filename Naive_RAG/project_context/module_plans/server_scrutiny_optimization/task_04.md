# Task 04: Harden Upload Limits And Validation

## Goal

Reduce memory, parser, and ingestion abuse risk in document uploads.

## Scope

- Add Multer file size limits.
- Validate extension, MIME type, and content signature where practical.
- Limit extracted text size and maximum chunk count.
- Add tests for oversized and mismatched uploads.

## Implementation Details

- Keep server validation authoritative.
- Return controlled `400` or `413` style errors instead of parser crashes.

## Completion Criteria

- Oversized and unsupported files are rejected before expensive processing.
- Parser failures return standardized errors.
- Tests pass.

## Test Cases

- Reject file above max size.
- Reject unsupported extension.
- Reject mismatched extension/content.
- Reject excessive extracted text or chunk count.

## Review Gate

Stop after this task and wait for user review before starting Task 05.
