import { env } from './env';

export const qdrantConfig = {
  url: env.QDRANT_URL,
  collectionName: env.QDRANT_COLLECTION,
  vectorSize: env.QDRANT_VECTOR_SIZE,
  distance: 'Cosine',
} as const;
