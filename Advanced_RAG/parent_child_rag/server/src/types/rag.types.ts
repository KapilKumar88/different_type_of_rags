export type ChunkPayload = {
  chunkId: string;
  documentId: string;
  parentId: string;
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
