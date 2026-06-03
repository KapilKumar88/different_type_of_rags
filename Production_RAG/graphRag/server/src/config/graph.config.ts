import { env } from './env';

export const graphConfig = {
  maxHops: env.GRAPH_MAX_HOPS,
  entitySeedLimit: env.GRAPH_ENTITY_SEED_LIMIT,
  neighborLimit: env.GRAPH_NEIGHBOR_LIMIT,
  maxGraphContextCharacters: env.GRAPH_MAX_CONTEXT_CHARACTERS,
  maxEntitiesPerChunk: env.GRAPH_MAX_ENTITIES_PER_CHUNK,
  maxRelationshipsPerChunk: env.GRAPH_MAX_RELATIONSHIPS_PER_CHUNK,
} as const;
