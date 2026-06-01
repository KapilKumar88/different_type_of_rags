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

export type RetrievalStrategy = 'query_rewriting';

export type RetrievalMetadata = {
  originalQuery: string;
  rewrittenQuery: string;
  wasRewritten: boolean;
  strategy: RetrievalStrategy;
  createdAt: string;
};
