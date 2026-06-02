import { env } from './env';

export const webSearchConfig = {
  tavilyApiKey: env.TAVILY_API_KEY,
  tavilyBaseUrl: env.TAVILY_BASE_URL,
  maxResults: env.RAG_WEB_SEARCH_MAX_RESULTS,
  timeoutMs: env.RAG_WEB_SEARCH_TIMEOUT_MS,
} as const;
