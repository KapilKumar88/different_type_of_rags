export const documentUploadConfig = {
  maxFileSizeBytes: 50 * 1024 * 1024,
  maxExtractedTextCharacters: 1_000_000,
  maxChunkCount: 1_000,
  allowedMimeTypesByExtension: {
    '.txt': ['text/plain'],
    '.md': ['text/markdown', 'text/plain'],
    '.csv': ['text/csv', 'application/csv', 'application/vnd.ms-excel'],
    '.json': ['application/json', 'text/json', 'text/plain'],
    '.xlsx': [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    '.pdf': ['application/pdf'],
    '.docx': [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
  maxStructuredTableCount: 100,
  maxStructuredRowCount: 20_000,
  maxStructuredColumnCount: 200,
} as const;

export type SupportedDocumentExtension =
  keyof typeof documentUploadConfig.allowedMimeTypesByExtension;
