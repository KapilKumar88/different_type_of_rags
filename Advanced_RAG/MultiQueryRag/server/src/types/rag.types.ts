export type ChunkPayload = {
  chunkId: string;
  documentId: string;
  fileName: string;
  text: string;
  pageNumber?: number;
  createdAt: string;
};

export type VectorPoint = {
  id: string;
  vector: number[];
  payload: ChunkPayload;
};

export type RetrievedChunk = ChunkPayload & {
  score: number;
};

export type RetrievalStrategy = 'multi_query';

export type MultiQueryRetrievalMetadata = {
  originalQuery: string;
  generatedQueries: string[];
  usedQueryCount: number;
  strategy: 'multi_query';
  createdAt: string;
};

export type RetrievalMetadata = MultiQueryRetrievalMetadata;
