export type RagDocument = {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
};

export type DocumentsListResponse = {
  success: true;
  message: string;
  data: {
    documents: RagDocument[];
  };
};

export type DocumentMutationResponse = {
  success: true;
  message: string;
  data: {
    document: RagDocument;
  };
};
