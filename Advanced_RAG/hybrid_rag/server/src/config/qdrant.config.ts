import { env } from './env';

export const qdrantConfig = {
  url: env.QDRANT_URL,
  collectionName: env.QDRANT_COLLECTION,
  vectorSize: env.QDRANT_VECTOR_SIZE,
  sparseVectorName: env.QDRANT_SPARSE_VECTOR_NAME,
  distance: 'Cosine',
} as const;
