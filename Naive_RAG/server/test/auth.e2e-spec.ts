import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthModule } from '../src/api/v1/auth/auth.module';
import { AuthRepository } from '../src/api/v1/auth/auth.repository';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import type { User } from '../src/database/schemas';

describe('Auth API (e2e)', () => {
  let app: INestApplication<App>;
  let users: User[];

  beforeEach(async () => {
    users = [];

    const authRepository = {
      findByEmail: jest.fn(async (email: string): Promise<User | null> => {
        return users.find((user) => user.email === email) ?? null;
      }),
      findById: jest.fn(async (id: string): Promise<User | null> => {
        return users.find((user) => user.id === id) ?? null;
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(AuthRepository)
      .useValue(authRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('registers a user and sets an auth cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      })
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

  it('logs in a user and sets an auth cookie', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'ada@example.com',
        password: 'password123',
      })
      .expect(200);

    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.body.data.user).toEqual({
      id: 'user-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
  });

  it('returns the authenticated user when a valid cookie is present', async () => {
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      });
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

  it('returns validation errors with the standard error shape', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'password123',
        confirmPassword: 'password456',
      })
      .expect(422);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Validation failed');
    expect(response.body.data.fieldErrors.confirmPassword).toEqual([
      'Passwords do not match',
    ]);
  });

  it('returns duplicate registration errors with the standard error shape', async () => {
    const payload = {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    };

    await request(app.getHttpServer()).post('/api/v1/auth/register').send(payload);

    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(payload)
      .expect(409);

    expect(response.body).toEqual({
      success: false,
      message: 'Email already exists',
      data: null,
    });
  });

  it('returns invalid login errors with the standard error shape', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'missing@example.com',
        password: 'password123',
      })
      .expect(401);

    expect(response.body).toEqual({
      success: false,
      message: 'Invalid credentials',
      data: null,
    });
  });
});
