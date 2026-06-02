import type {
  RagVectorType,
  RetrievedChunk,
  RetrievedVectorMatch,
} from '../../types/rag.types';

export type ParentTextChunk = {
  text: string;
  pageNumber?: number;
};

export type MultiVectorIndexDocumentInput = {
  documentId: string;
  fileName: string;
  createdAt: string;
  chunks: ParentTextChunk[];
};

export type GeneratedChunkRepresentations = {
  chunkIndex: number;
  summary: string;
  questions: string[];
};

export type MultiVectorRepresentation = {
  vectorId: string;
  chunkId: string;
  vectorType: RagVectorType;
  vectorText: string;
  parentText: string;
  pageNumber?: number;
};

export type FusedRetrievedChunk = Omit<
  RetrievedChunk,
  'vectorId' | 'vectorType' | 'vectorText'
> & {
  bestMatchType: RagVectorType;
  matches: RetrievedVectorMatch[];
};
