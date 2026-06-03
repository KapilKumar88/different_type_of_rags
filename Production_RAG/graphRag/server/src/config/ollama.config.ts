import { env } from './env';

export const ollamaConfig = {
  baseUrl: env.OLLAMA_BASE_URL,
  llmModel: env.OLLAMA_LLM_MODEL,
} as const;
