import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AuthRepository } from '../src/api/v1/auth/auth.repository';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import type { User } from '../src/database/schemas';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_REGISTER_PAYLOAD = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'password123',
  confirmPassword: 'password123',
} as const;

function buildMockAuthRepository(users: User[]) {
  return {
    findByEmail: jest.fn(async (email: string): Promise<User | null> => {
      return users.find((u) => u.email === email) ?? null;
    }),
    findById: jest.fn(async (id: string): Promise<User | null> => {
      return users.find((u) => u.id === id) ?? null;
    }),
    create: jest.fn(
      async (data: {
        name: string;
        email: string;
        passwordHash: string;
      }): Promise<User> => {
        const user: User = {
          id: `user-${users.length + 1}`,
          name: data.name,
          email: data.email,
          passwordHash: data.passwordHash,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        };
        users.push(user);
        return user;
      },
    ),
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('Auth API (e2e)', () => {
  let app: INestApplication<App>;
  let users: User[];

  beforeEach(async () => {
    users = [];

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AuthRepository)
      .useValue(buildMockAuthRepository(users))
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  // -------------------------------------------------------------------------
  // POST /api/v1/auth/register — happy path
  // -------------------------------------------------------------------------

  describe('POST /api/v1/auth/register — happy path', () => {
    it('returns 201 with the new user and sets an auth cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(VALID_REGISTER_PAYLOAD)
        .expect(201);

      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.body).toEqual({
        success: true,
        message: 'Account created successfully',
        data: {
          user: {
            id: 'user-1',
            name: 'Ada Lovelace',
            email: 'ada@example.com',
          },
        },
      });
    });

    it('does not expose passwordHash in the response', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(VALID_REGISTER_PAYLOAD)
        .expect(201);

      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('normalises email to lowercase', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...VALID_REGISTER_PAYLOAD, email: 'ADA@EXAMPLE.COM' })
        .expect(201);

      expect(response.body.data.user.email).toBe('ada@example.com');
    });
  });

  // -------------------------------------------------------------------------
  // POST /api/v1/auth/register — cookie attributes
  // -------------------------------------------------------------------------

  describe('POST /api/v1/auth/register — cookie security attributes', () => {
    it('sets the auth cookie with HttpOnly flag', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(VALID_REGISTER_PAYLOAD)
        .expect(201);

      const setCookie = response.headers['set-cookie'] as string | string[];
      const cookieHeader = Array.isArray(setCookie)
        ? setCookie.join('; ')
        : setCookie;

      expect(cookieHeader.toLowerCase()).toContain('httponly');
    });

    it('sets the auth cookie with the configured name', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(VALID_REGISTER_PAYLOAD)
        .expect(201);

      const setCookie = response.headers['set-cookie'] as string | string[];
      const cookieHeader = Array.isArray(setCookie)
        ? setCookie.join('; ')
        : setCookie;

      expect(cookieHeader).toContain('rag_auth_token=');
    });
  });

  // -------------------------------------------------------------------------
  // POST /api/v1/auth/register — input validation
  // -------------------------------------------------------------------------

  describe('POST /api/v1/auth/register — input validation', () => {
    async function registerExpect422(payload: Record<string, unknown>) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(payload)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      return response.body.data.fieldErrors as Record<string, string[]>;
    }

    it('rejects when name is missing', async () => {
      const { email, password, confirmPassword } = VALID_REGISTER_PAYLOAD;
      const errors = await registerExpect422({ email, password, confirmPassword });
      expect(errors.name).toBeDefined();
      expect(errors.name.length).toBeGreaterThan(0);
    });

    it('rejects when name is shorter than 2 characters', async () => {
      const errors = await registerExpect422({
        ...VALID_REGISTER_PAYLOAD,
        name: 'A',
      });
      expect(errors.name).toBeDefined();
      expect(errors.name.length).toBeGreaterThan(0);
    });

    it('rejects when name exceeds 120 characters', async () => {
      const errors = await registerExpect422({
        ...VALID_REGISTER_PAYLOAD,
        name: 'A'.repeat(121),
      });
      expect(errors.name).toBeDefined();
      expect(errors.name.length).toBeGreaterThan(0);
    });

    it('accepts a name of exactly 2 characters', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...VALID_REGISTER_PAYLOAD, name: 'Jo' })
        .expect(201);
    });

    it('accepts a name of exactly 120 characters', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...VALID_REGISTER_PAYLOAD, name: 'A'.repeat(120) })
        .expect(201);
    });

    it('rejects an invalid email format', async () => {
      const errors = await registerExpect422({
        ...VALID_REGISTER_PAYLOAD,
        email: 'not-an-email',
      });
      expect(errors.email).toBeDefined();
      expect(errors.email.length).toBeGreaterThan(0);
    });

    it('rejects an email without a domain', async () => {
      const errors = await registerExpect422({
        ...VALID_REGISTER_PAYLOAD,
        email: 'user@',
      });
      expect(errors.email).toBeDefined();
    });

    it('rejects a password shorter than 8 characters', async () => {
      const errors = await registerExpect422({
        ...VALID_REGISTER_PAYLOAD,
        password: 'short1',
        confirmPassword: 'short1',
      });
      expect(errors.password).toBeDefined();
      expect(errors.password.length).toBeGreaterThan(0);
    });

    it('rejects a password longer than 128 characters', async () => {
      const longPassword = 'A'.repeat(129);
      const errors = await registerExpect422({
        ...VALID_REGISTER_PAYLOAD,
        password: longPassword,
        confirmPassword: longPassword,
      });
      expect(errors.password).toBeDefined();
      expect(errors.password.length).toBeGreaterThan(0);
    });

    it('accepts a password of exactly 8 characters', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...VALID_REGISTER_PAYLOAD, password: '12345678', confirmPassword: '12345678' })
        .expect(201);
    });

    it('accepts a password of exactly 128 characters', async () => {
      const maxPassword = 'A'.repeat(128);
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...VALID_REGISTER_PAYLOAD, password: maxPassword, confirmPassword: maxPassword })
        .expect(201);
    });

    it('rejects when confirmPassword does not match password', async () => {
      const errors = await registerExpect422({
        ...VALID_REGISTER_PAYLOAD,
        confirmPassword: 'different_password',
      });
      expect(errors.confirmPassword).toEqual(['Passwords do not match']);
    });

    it('rejects when confirmPassword is missing', async () => {
      const { name, email, password } = VALID_REGISTER_PAYLOAD;
      const errors = await registerExpect422({ name, email, password });
      expect(errors.confirmPassword).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // POST /api/v1/auth/register — business rule violations
  // -------------------------------------------------------------------------

  describe('POST /api/v1/auth/register — business rule violations', () => {
    it('returns 409 when the email is already registered', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(VALID_REGISTER_PAYLOAD);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(VALID_REGISTER_PAYLOAD)
        .expect(409);

      expect(response.body).toEqual({
        success: false,
        message: 'Email already exists',
        data: null,
      });
    });

    it('treats email registration as case-insensitive (normalised to lowercase)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(VALID_REGISTER_PAYLOAD);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ ...VALID_REGISTER_PAYLOAD, email: 'ADA@EXAMPLE.COM' })
        .expect(409);

      expect(response.body.message).toBe('Email already exists');
    });
  });

  // -------------------------------------------------------------------------
  // POST /api/v1/auth/login — happy path
  // -------------------------------------------------------------------------

  describe('POST /api/v1/auth/login — happy path', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(VALID_REGISTER_PAYLOAD);
    });

    it('returns 200 with the user and sets an auth cookie', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: VALID_REGISTER_PAYLOAD.email, password: VALID_REGISTER_PAYLOAD.password })
        .expect(200);

      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.body).toMatchObject({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: 'user-1',
            name: 'Ada Lovelace',
            email: 'ada@example.com',
          },
        },
      });
    });

    it('does not expose passwordHash in the response', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: VALID_REGISTER_PAYLOAD.email, password: VALID_REGISTER_PAYLOAD.password })
        .expect(200);

      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('accepts email in any case (normalised to lowercase)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'ADA@EXAMPLE.COM', password: VALID_REGISTER_PAYLOAD.password })
        .expect(200);

      expect(response.body.data.user.email).toBe('ada@example.com');
    });
  });

  // -------------------------------------------------------------------------
  // POST /api/v1/auth/login — input validation
  // -------------------------------------------------------------------------

  describe('POST /api/v1/auth/login — input validation', () => {
    async function loginExpect422(payload: Record<string, unknown>) {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(payload)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      return response.body.data.fieldErrors as Record<string, string[]>;
    }

    it('rejects when email is missing', async () => {
      const errors = await loginExpect422({ password: 'password123' });
      expect(errors.email).toBeDefined();
    });

    it('rejects an invalid email format', async () => {
      const errors = await loginExpect422({ email: 'not-an-email', password: 'password123' });
      expect(errors.email).toBeDefined();
      expect(errors.email.length).toBeGreaterThan(0);
    });

    it('rejects when password is missing', async () => {
      const errors = await loginExpect422({ email: 'ada@example.com' });
      expect(errors.password).toBeDefined();
    });

    it('rejects a password shorter than 8 characters', async () => {
      const errors = await loginExpect422({ email: 'ada@example.com', password: 'short' });
      expect(errors.password).toBeDefined();
      expect(errors.password.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // POST /api/v1/auth/login — credential failures
  // -------------------------------------------------------------------------

  describe('POST /api/v1/auth/login — credential failures', () => {
    it('returns 401 for a non-existent email (does not reveal user enumeration)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'password123' })
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Invalid credentials',
        data: null,
      });
    });

    it('returns 401 for a correct email with a wrong password', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(VALID_REGISTER_PAYLOAD);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: VALID_REGISTER_PAYLOAD.email, password: 'wrongpassword' })
        .expect(401);

      // Same message as non-existent user to prevent user enumeration
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid credentials',
        data: null,
      });
    });
  });

  // -------------------------------------------------------------------------
  // GET /api/v1/auth/me — happy path
  // -------------------------------------------------------------------------

  describe('GET /api/v1/auth/me — happy path', () => {
    it('returns the authenticated user when a valid cookie is present', async () => {
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(VALID_REGISTER_PAYLOAD);
      const authCookie = registerResponse.headers['set-cookie'];

      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', authCookie)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Authenticated user retrieved',
        data: {
          user: {
            id: 'user-1',
            name: 'Ada Lovelace',
            email: 'ada@example.com',
          },
        },
      });
    });

    it('does not expose passwordHash in the /me response', async () => {
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(VALID_REGISTER_PAYLOAD);

      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', registerResponse.headers['set-cookie'])
        .expect(200);

      expect(response.body.data.user.passwordHash).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // GET /api/v1/auth/me — auth guard rejections
  // -------------------------------------------------------------------------

  describe('GET /api/v1/auth/me — auth guard rejections', () => {
    it('returns 401 when no cookie is present', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);

      expect(response.body).toEqual({
        success: false,
        message: 'Authentication cookie is missing',
        data: null,
      });
    });

    it('returns 401 for a tampered JWT (invalid signature)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', 'rag_auth_token=eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1c2VyLTEiLCJlbWFpbCI6ImFkYUBleGFtcGxlLmNvbSJ9.INVALID_SIGNATURE')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid authentication cookie');
    });

    it('returns 401 for a completely malformed cookie value', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', 'rag_auth_token=this.is.not.a.jwt')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid authentication cookie');
    });

    it('returns 401 for a JWT signed with a different secret', async () => {
      // Manually crafted JWT with a different secret — signature will not verify
      const wrongSecretJwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
        '.eyJzdWIiOiJ1c2VyLTEiLCJlbWFpbCI6ImFkYUBleGFtcGxlLmNvbSIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjo5OTk5OTk5OTk5fQ' +
        '.wrong_signature_here';

      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Cookie', `rag_auth_token=${wrongSecretJwt}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // POST /api/v1/auth/logout
  // -------------------------------------------------------------------------

  describe('POST /api/v1/auth/logout', () => {
    it('returns 200 and expires the auth cookie', async () => {
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(VALID_REGISTER_PAYLOAD);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Cookie', registerResponse.headers['set-cookie'])
        .expect(200);

      const setCookie = response.headers['set-cookie'] as string | string[];
      const cookieHeader = Array.isArray(setCookie)
        ? setCookie.join('; ')
        : setCookie;

      expect(response.body).toEqual({
        success: true,
        message: 'Logout successful',
        data: null,
      });
      expect(cookieHeader).toContain('rag_auth_token=');
      expect(cookieHeader.toLowerCase()).toContain('expires=thu, 01 jan 1970');
    });

    it('is idempotent when no auth cookie is present', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Logout successful',
        data: null,
      });
    });
  });
});
