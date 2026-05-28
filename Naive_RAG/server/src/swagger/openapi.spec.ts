import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { AppModule } from '../app.module';
import { DatabaseService } from '../services/database/database.service';
import { createSwaggerDocument, setupSwagger, swaggerPath } from './openapi';

describe('OpenAPI documentation', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(DatabaseService)
      .useValue({
        instance: {},
        onModuleDestroy: jest.fn(),
      })
      .compile();

    app = moduleRef.createNestApplication();
  });

  afterEach(async () => {
    await app.close();
  });

  it('generates a Swagger document for all public API controllers', () => {
    const document = createSwaggerDocument(app);

    expect(document.info.title).toBe('Naive RAG API');
    expect(document.paths).toHaveProperty('/api/v1/auth/register');
    expect(document.paths).toHaveProperty('/api/v1/csrf-token');
    expect(document.paths).toHaveProperty('/api/v1/documents/upload');
    expect(document.paths).toHaveProperty('/api/v1/chat/conversations');
    expect(document.paths).toHaveProperty(
      '/api/v1/chat/conversations/{conversationId}/messages/{messageId}/stream',
    );
    expect(document.components?.securitySchemes).toHaveProperty('auth-cookie');
    expect(document.components?.securitySchemes).toHaveProperty('csrf-token');
  });

  it('registers Swagger UI and JSON endpoints on the app', () => {
    expect(() => setupSwagger(app)).not.toThrow();
    expect(swaggerPath).toBe('api/docs');
  });
});
