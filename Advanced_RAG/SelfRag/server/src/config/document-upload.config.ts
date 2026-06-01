export const documentUploadConfig = {
  maxFileSizeBytes: 50 * 1024 * 1024,
  maxExtractedTextCharacters: 1_000_000,
  maxChunkCount: 1_000,
  allowedMimeTypesByExtension: {
    '.txt': ['text/plain'],
    '.md': ['text/markdown', 'text/plain'],
    '.csv': ['text/csv', 'application/csv', 'application/vnd.ms-excel'],
    '.pdf': ['application/pdf'],
    '.docx': [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
} as const;

export type SupportedDocumentExtension =
  keyof typeof documentUploadConfig.allowedMimeTypesByExtension;
