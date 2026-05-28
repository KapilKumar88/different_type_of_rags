import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cookieConfig } from '../config/cookie.config';

export const swaggerPath = 'api/docs';
export const authCookieSecurityName = 'auth-cookie';
export const csrfSecurityName = 'csrf-token';

export const uuidSchema = {
  type: 'string',
  format: 'uuid',
};

export const safeUserSchema = {
  type: 'object',
  required: ['id', 'name', 'email'],
  properties: {
    id: uuidSchema,
    name: { type: 'string', example: 'Ada Lovelace' },
    email: { type: 'string', format: 'email', example: 'ada@example.com' },
  },
};

export const documentSchema = {
  type: 'object',
  required: [
    'id',
    'userId',
    'fileName',
    'mimeType',
    'sizeBytes',
    'chunkCount',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: uuidSchema,
    userId: uuidSchema,
    fileName: { type: 'string', example: 'rag-notes.pdf' },
    mimeType: { type: 'string', example: 'application/pdf' },
    sizeBytes: { type: 'integer', example: 20480 },
    chunkCount: { type: 'integer', example: 12 },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const retrievedChunkSchema = {
  type: 'object',
  required: ['chunkId', 'documentId', 'fileName', 'text', 'createdAt', 'score'],
  properties: {
    chunkId: { type: 'string' },
    documentId: uuidSchema,
    fileName: { type: 'string' },
    text: { type: 'string' },
    pageNumber: { type: 'integer', nullable: true },
    createdAt: { type: 'string', format: 'date-time' },
    score: { type: 'number', example: 0.91 },
  },
};

export const conversationMessageSchema = {
  type: 'object',
  required: [
    'id',
    'conversationId',
    'role',
    'content',
    'sources',
    'createdAt',
    'updatedAt',
  ],
  properties: {
    id: uuidSchema,
    conversationId: uuidSchema,
    role: { type: 'string', enum: ['user', 'assistant'] },
    content: { type: 'string' },
    sources: {
      nullable: true,
      type: 'array',
      items: retrievedChunkSchema,
    },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const conversationSchema = {
  type: 'object',
  required: ['id', 'userId', 'title', 'createdAt', 'updatedAt', 'documentIds'],
  properties: {
    id: uuidSchema,
    userId: uuidSchema,
    title: { type: 'string', example: 'Project docs' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    documentIds: {
      type: 'array',
      items: uuidSchema,
    },
  },
};

export const conversationDetailsSchema = {
  ...conversationSchema,
  required: [...conversationSchema.required, 'messages'],
  properties: {
    ...conversationSchema.properties,
    messages: {
      type: 'array',
      items: conversationMessageSchema,
    },
  },
};

export function successEnvelope(data: Record<string, unknown> | null) {
  return {
    type: 'object',
    required: ['success', 'message', 'data'],
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string' },
      data: data === null ? { nullable: true, example: null } : data,
    },
  };
}

export const errorEnvelope = {
  type: 'object',
  required: ['success', 'message', 'data'],
  properties: {
    success: { type: 'boolean', example: false },
    message: { type: 'string' },
    data: { nullable: true, example: null },
  },
};

export const validationErrorResponse = {
  description: 'Request validation failed',
  schema: errorEnvelope,
};

export const unauthorizedErrorResponse = {
  description: 'Authentication cookie is missing or invalid',
  schema: errorEnvelope,
};

export const csrfErrorResponse = {
  description: 'CSRF token is missing or invalid',
  schema: errorEnvelope,
};

export const rateLimitErrorResponse = {
  description: 'Rate limit exceeded',
  schema: errorEnvelope,
};

export const notFoundErrorResponse = {
  description: 'Resource not found',
  schema: errorEnvelope,
};

export const serverErrorResponse = {
  description: 'Unexpected server error',
  schema: errorEnvelope,
};

export function createSwaggerDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Naive RAG API')
    .setDescription(
      'Authentication, document ingestion, and scoped RAG chat API',
    )
    .setVersion('1.0')
    .addCookieAuth(
      cookieConfig.name,
      {
        type: 'apiKey',
        in: 'cookie',
        name: cookieConfig.name,
        description: 'HTTP-only JWT auth cookie set by login/register',
      },
      authCookieSecurityName,
    )
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-csrf-token',
        description: 'CSRF token required for mutating requests',
      },
      csrfSecurityName,
    )
    .build();

  return SwaggerModule.createDocument(app, config);
}

export function setupSwagger(app: INestApplication): void {
  SwaggerModule.setup(swaggerPath, app, createSwaggerDocument(app), {
    jsonDocumentUrl: `${swaggerPath}-json`,
  });
}
