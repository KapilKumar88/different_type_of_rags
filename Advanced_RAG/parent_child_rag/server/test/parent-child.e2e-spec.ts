import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureCsrfProtection } from '../src/common/security/csrf-protection';
import { configureSecurityHeaders } from '../src/common/security/security-headers';
import { DatabaseService } from '../src/services/database/database.service';
import { documentParents } from '../src/database/schemas';
import { eq } from 'drizzle-orm';

const REGISTER_PAYLOAD = {
  name: 'Parent Child E2E',
  email: `pc-e2e-${Date.now()}@test.com`,
  password: 'TestPass123!',
  confirmPassword: 'TestPass123!',
};

function joinCookies(cookies: Array<string | undefined>): string {
  return cookies.filter(Boolean).join('; ');
}

/**
 * Get a CSRF token bound to the given existing cookies (e.g. the auth cookie).
 * double-csrf binds the token to the session identifier (= auth cookie when present),
 * so every authenticated request must use a token fetched with that auth cookie.
 */
async function getCsrf(
  app: INestApplication<App>,
  existingCookies?: string,
): Promise<{ token: string; csrfCookie: string; allCookies: string }> {
  const req = request(app.getHttpServer()).get('/api/v1/csrf-token');
  if (existingCookies) req.set('Cookie', existingCookies);

  const res = await req.expect(200);
  const token = (res.body as { data: { csrfToken: string } }).data.csrfToken;
  const setCookies = res.headers['set-cookie'] as unknown as string | string[];
  const csrfCookie = Array.isArray(setCookies) ? setCookies[0] : setCookies;
  const allCookies = joinCookies([existingCookies, csrfCookie]);
  return { token, csrfCookie, allCookies };
}

describe('Parent-Child RAG — E2E', () => {
  let app: INestApplication<App>;
  let db: DatabaseService;
  let authCookie: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    configureSecurityHeaders(app);
    app.use(cookieParser());
    configureCsrfProtection(app);
    await app.init();

    db = module.get(DatabaseService);

    // Register (no auth cookie yet, so CSRF session = ip:user-agent)
    const regCsrf = await getCsrf(app);
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .set('x-csrf-token', regCsrf.token)
      .set('Cookie', regCsrf.allCookies)
      .send(REGISTER_PAYLOAD);

    // Login
    const loginCsrf = await getCsrf(app);
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .set('x-csrf-token', loginCsrf.token)
      .set('Cookie', loginCsrf.allCookies)
      .send({ email: REGISTER_PAYLOAD.email, password: REGISTER_PAYLOAD.password });

    expect(loginRes.status).toBe(200);
    const loginCookies = loginRes.headers['set-cookie'] as unknown as string | string[];
    authCookie = Array.isArray(loginCookies)
      ? loginCookies.find((c) => c.startsWith('rag_auth_token')) ?? loginCookies[0]
      : loginCookies;
  }, 30_000);

  afterAll(async () => {
    await app.close();
  });

  it('upload creates document_parents rows with FK cascade on delete', async () => {
    const documentText = [
      'Parent-Child RAG splits documents into large parent chunks and small child chunks.',
      'Small child chunks are embedded in Qdrant for precise semantic search.',
      'When a query arrives, the system searches child chunks, then maps them back to parent chunks.',
      'The larger parent text is fed to the LLM for richer, more complete answers.',
      'This resolves the classic RAG trade-off between retrieval precision and answer context.',
      'Each child chunk carries a parentId field linking it to its parent row in Postgres.',
      'The document_parents table stores full parent text with a FK to documents.id.',
    ].join('\n');

    // CSRF must be fetched WITH the auth cookie so it's bound to the same session
    const upCsrf = await getCsrf(app, authCookie);

    const uploadRes = await request(app.getHttpServer())
      .post('/api/v1/documents/upload')
      .set('x-csrf-token', upCsrf.token)
      .set('Cookie', upCsrf.allCookies)
      .attach('file', Buffer.from(documentText), {
        filename: 'parent-child-test.txt',
        contentType: 'text/plain',
      });

    expect(uploadRes.status).toBe(201);
    const docId = (uploadRes.body as { data: { document: { id: string } } }).data.document.id;
    expect(docId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );

    // Verify document_parents rows were created in Postgres
    const parents = await db.instance
      .select()
      .from(documentParents)
      .where(eq(documentParents.documentId, docId));

    expect(parents.length).toBeGreaterThan(0);
    expect(parents[0].parentIndex).toBe(0);
    expect(parents[0].text.length).toBeGreaterThan(50);
    expect(parents[0].documentId).toBe(docId);

    // parentIndex must be 0-based and contiguous
    const indices = parents.map((p) => p.parentIndex).sort((a, b) => a - b);
    indices.forEach((idx, i) => expect(idx).toBe(i));

    // FK cascade: delete document → parents must be gone
    const delCsrf = await getCsrf(app, authCookie);
    const deleteRes = await request(app.getHttpServer())
      .delete(`/api/v1/documents/${docId}`)
      .set('x-csrf-token', delCsrf.token)
      .set('Cookie', delCsrf.allCookies);

    expect(deleteRes.status).toBe(200);

    const parentsAfter = await db.instance
      .select()
      .from(documentParents)
      .where(eq(documentParents.documentId, docId));

    expect(parentsAfter).toHaveLength(0);
  }, 60_000);
});
