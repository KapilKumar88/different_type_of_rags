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

export type MultiHopStepKind = 'sub-question' | 'follow-up';

export type MultiHopStep = {
  hopNumber: number;
  kind: MultiHopStepKind;
  query: string;
  retrievedChunkIds: string[];
  newChunkCount: number;
};

export type MultiHopResult = {
  sources: RetrievedChunk[];
  hops: MultiHopStep[];
};
