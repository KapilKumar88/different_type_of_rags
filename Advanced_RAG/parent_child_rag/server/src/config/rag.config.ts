import { env } from './env';

export const ragConfig = {
  topK: env.RAG_TOP_K,
  // Parent-child RAG: small child chunks are embedded/searched for precise
  // matching, while the larger parent chunk they belong to is fed to the LLM.
  parentChunkSize: env.RAG_PARENT_CHUNK_SIZE,
  parentChunkOverlap: env.RAG_PARENT_CHUNK_OVERLAP,
  childChunkSize: env.RAG_CHILD_CHUNK_SIZE,
  childChunkOverlap: env.RAG_CHILD_CHUNK_OVERLAP,
  // How many child chunks to retrieve before deduplicating to unique parents.
  childTopK: env.RAG_CHILD_TOP_K,
  // Maximum number of unique parent chunks fed to the LLM as context.
  parentTopK: env.RAG_PARENT_TOP_K,
  maxPromptContextCharacters: 6000,
  maxPromptHistoryCharacters: 3000,
  fallbackAnswer: 'I could not find this information in the uploaded document.',
} as const;
