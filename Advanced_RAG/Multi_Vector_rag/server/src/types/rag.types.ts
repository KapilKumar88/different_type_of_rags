export type RagVectorType = 'original' | 'summary' | 'question';

export type RetrievedVectorMatch = {
  vectorId: string;
  vectorType: RagVectorType;
  vectorText: string;
  score: number;
};

export type ChunkPayload = {
  chunkId: string;
  documentId: string;
  fileName: string;
  text: string;
  vectorId?: string;
  vectorType?: RagVectorType;
  vectorText?: string;
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
  bestMatchType?: RagVectorType;
  matches?: RetrievedVectorMatch[];
};
