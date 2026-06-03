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

export type ImageVectorPayload = {
  imageId: string;
  documentId: string;
  fileName: string;
  pageNumber?: number;
  caption?: string;
  source: 'upload' | 'pdf' | 'docx';
  createdAt: string;
};

export type ImageVectorPoint = {
  id: string;
  vector: number[];
  payload: ImageVectorPayload;
};

export type RetrievedImage = ImageVectorPayload & {
  score: number;
};

/**
 * Unified, modality-tagged retrieval result. Text chunks come from the
 * nomic-embed-text collection; images come from the CLIP collection.
 */
export type RetrievedSource =
  | ({ modality: 'text' } & RetrievedChunk)
  | ({ modality: 'image' } & RetrievedImage);
