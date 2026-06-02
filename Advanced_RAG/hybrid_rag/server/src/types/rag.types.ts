export type ChunkPayload = {
  chunkId: string;
  documentId: string;
  fileName: string;
  text: string;
  pageNumber?: number;
  createdAt: string;
  sparseIndexed?: boolean;
};

export type VectorPoint = {
  id: string;
  vector: number[];
  payload: ChunkPayload;
};

export type SparseVector = {
  indices: number[];
  values: number[];
};

export type SparseVectorPoint = {
  id: string;
  sparseVector: SparseVector;
};

export type RetrievalMode = 'dense' | 'sparse' | 'hybrid';

export type RetrievedChunk = ChunkPayload & {
  score: number;
  retrievalMode?: RetrievalMode;
  denseScore?: number;
  sparseScore?: number;
  denseRank?: number;
  sparseRank?: number;
};
