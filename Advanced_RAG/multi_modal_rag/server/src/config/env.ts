import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

const defaultJwtSecret = 'development-only-auth-secret-change-me';
const defaultCsrfSecret = 'development-only-csrf-secret-change-me';

const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().int().positive().default(3000),
    CLIENT_ORIGIN: z.url().default('http://localhost:5173'),
    DATABASE_URL: z.url(),
    DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
    JWT_SECRET: z.string().min(32).default(defaultJwtSecret),
    JWT_EXPIRES_IN: z.string().min(1).default('7d'),
    AUTH_COOKIE_NAME: z.string().min(1).default('rag_auth_token'),
    AUTH_COOKIE_MAX_AGE_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(604800000),
    AUTH_COOKIE_SECURE: z.coerce.boolean().default(false),
    AUTH_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    AUTH_COOKIE_DOMAIN: z.string().optional(),
    AUTH_RATE_LIMIT_TTL_MS: z.coerce.number().int().positive().default(60000),
    AUTH_RATE_LIMIT_LIMIT: z.coerce.number().int().positive().default(5),
    CSRF_COOKIE_NAME: z.string().min(1).default('rag_csrf_token'),
    CSRF_SECRET: z.string().min(32).default(defaultCsrfSecret),
    QDRANT_URL: z.url().default('http://localhost:6333'),
    QDRANT_COLLECTION: z.string().min(1).default('documents'),
    QDRANT_VECTOR_SIZE: z.coerce.number().int().positive().default(768),
    QDRANT_IMAGE_COLLECTION: z.string().min(1).default('image_vectors'),
    QDRANT_IMAGE_VECTOR_SIZE: z.coerce.number().int().positive().default(512),
    OLLAMA_BASE_URL: z.url().default('http://localhost:11434'),
    OLLAMA_EMBEDDING_MODEL: z.string().min(1).default('nomic-embed-text:v1.5'),
    OLLAMA_LLM_MODEL: z.string().min(1).default('minimax-m2.5:cloud'),
    OLLAMA_VISION_MODEL: z.string().min(1).default('llama3.2-vision'),
    CLIP_MODEL: z.string().min(1).default('Xenova/clip-vit-base-patch32'),
    RAG_TOP_K: z.coerce.number().int().positive().default(5),
    RAG_IMAGE_TOP_K: z.coerce.number().int().positive().default(3),
    RAG_UPLOAD_RATE_LIMIT_TTL_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(60000),
    RAG_UPLOAD_RATE_LIMIT_LIMIT: z.coerce.number().int().positive().default(5),
    RAG_CHAT_RATE_LIMIT_TTL_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(60000),
    RAG_CHAT_RATE_LIMIT_LIMIT: z.coerce.number().int().positive().default(30),
    RAG_STREAM_RATE_LIMIT_TTL_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(60000),
    RAG_STREAM_RATE_LIMIT_LIMIT: z.coerce.number().int().positive().default(10),
    RAG_RUNTIME_CONCURRENCY_LIMIT: z.coerce
      .number()
      .int()
      .positive()
      .default(4),
  })
  .superRefine((env, context) => {
    if (env.NODE_ENV !== 'production') {
      return;
    }

    if (env.JWT_SECRET === defaultJwtSecret) {
      context.addIssue({
        code: 'custom',
        path: ['JWT_SECRET'],
        message: 'JWT_SECRET must be set in production',
      });
    }

    if (env.CSRF_SECRET === defaultCsrfSecret) {
      context.addIssue({
        code: 'custom',
        path: ['CSRF_SECRET'],
        message: 'CSRF_SECRET must be set in production',
      });
    }
  });

function parseEnvFileLine(line: string): [string, string] | null {
  const trimmedLine = line.trim();

  if (!trimmedLine || trimmedLine.startsWith('#')) {
    return null;
  }

  const separatorIndex = trimmedLine.indexOf('=');

  if (separatorIndex === -1) {
    return null;
  }

  const key = trimmedLine.slice(0, separatorIndex).trim();
  const rawValue = trimmedLine.slice(separatorIndex + 1).trim();

  if (!key) {
    return null;
  }

  const value =
    (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
    (rawValue.startsWith("'") && rawValue.endsWith("'"))
      ? rawValue.slice(1, -1)
      : rawValue;

  return [key, value];
}

export function loadEnvFile(filePath = resolve(process.cwd(), '.env')) {
  const fileValues: Record<string, string> = {};

  if (!existsSync(filePath)) {
    return fileValues;
  }

  const fileContent = readFileSync(filePath, 'utf8');

  for (const line of fileContent.split(/\r?\n/)) {
    const parsedLine = parseEnvFileLine(line);

    if (!parsedLine) {
      continue;
    }

    const [key, value] = parsedLine;
    fileValues[key] = value;
  }

  return fileValues;
}

export function parseEnvironment(environment: NodeJS.ProcessEnv) {
  return envSchema.parse(environment);
}

export function mergeEnvironment(
  fileValues: Record<string, string>,
  environment: NodeJS.ProcessEnv,
) {
  return {
    ...fileValues,
    ...environment,
  };
}

export const env = parseEnvironment(
  mergeEnvironment(loadEnvFile(), process.env),
);

export type AppEnvironment = typeof env;
