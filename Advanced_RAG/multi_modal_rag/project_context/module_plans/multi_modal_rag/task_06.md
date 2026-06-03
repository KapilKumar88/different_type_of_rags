# Task 06: Client Image Support

## Goal

Let users upload images and see retrieved image sources in chat.

## Implementation Details

- `types/chat.types.ts`: replace `SourceChunk` with a `ChatSource` union
  (`TextSource | ImageSource`); messages persisted before multi-modal RAG (no
  `modality`) render as text.
- `config/api.config.ts`: add `documents.image(imageId)` endpoint helper.
- `types/document.types.ts`: add `imageCount`.
- `components/app/upload-dialog.tsx`: accept `.png/.jpg/.jpeg/.webp` (defense in
  depth; server authoritative).
- `components/chat/message-display.tsx`: render image sources as thumbnails fetched
  from the authenticated image endpoint; text sources unchanged.
- `routes/app.documents.tsx`: show image count alongside chunk count.

## Completion Criteria

- Image uploads work from the dialog; image sources render as thumbnails with
  captions; text sources unchanged.

## Review Gate

Client lint (pre-existing warnings only) and build pass.
