# Task 02: Parsing Layer for Images

## Goal

Make the pluggable parsing layer produce images alongside text.

## Implementation Details

- Extend `ParsedDocument` with `images: ParsedImage[]`
  (`document-parsing.types.ts`). Existing text parsers return `images: []`.
- Add `parsers/image-document.parser.ts` for `.png/.jpg/.jpeg/.webp`: magic-byte
  signature check; `parse` normalizes via `sharp` into one `ParsedImage`.
- `pdf-document.parser.ts`: after `getText`, call `getImage({ imageBuffer: true,
  imageThreshold })` and map embedded images → `ParsedImage[]` (best-effort;
  failures never break text).
- `docx-document.parser.ts`: a second mammoth pass with an image handler collects
  embedded image buffers → `ParsedImage[]`.
- Shared `parsing/helpers/image.helpers.ts#normalizeImage` decodes, flattens,
  downscales to `maxImageEdgePx`, re-encodes to PNG, and drops sub-threshold
  images.
- Register `ImageDocumentParser` in the parsing service + module.

## Completion Criteria

- Standalone images and embedded PDF/DOCX images become normalized `ParsedImage`
  records; text extraction is unchanged.

## Review Gate

`image-document.parser.spec.ts` and the parsing service spec pass.
