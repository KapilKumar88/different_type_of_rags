export const documentUploadConfig = {
  maxFileSizeBytes: 50 * 1024 * 1024,
  maxExtractedTextCharacters: 1_000_000,
  maxChunkCount: 1_000,
  // Multi-modal image ingestion limits.
  maxImageCount: 50,
  maxImageBytes: 10 * 1024 * 1024,
  // Embedded images (in PDFs/DOCX) with width OR height below this are skipped
  // to avoid indexing tiny decorative/tracking graphics.
  minExtractedImagePx: 64,
  // Oversized images are downscaled to this longest edge before storage/embedding.
  maxImageEdgePx: 1024,
  allowedMimeTypesByExtension: {
    '.txt': ['text/plain'],
    '.md': ['text/markdown', 'text/plain'],
    '.csv': ['text/csv', 'application/csv', 'application/vnd.ms-excel'],
    '.pdf': ['application/pdf'],
    '.docx': [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    '.png': ['image/png'],
    '.jpg': ['image/jpeg'],
    '.jpeg': ['image/jpeg'],
    '.webp': ['image/webp'],
  },
} as const;

export type SupportedDocumentExtension =
  keyof typeof documentUploadConfig.allowedMimeTypesByExtension;
