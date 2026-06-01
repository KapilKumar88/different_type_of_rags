import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash } from 'bcryptjs';
import type { User } from '../../../database/schemas';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const updatedAt = new Date('2026-01-01T00:00:00.000Z');

function createUser(overrides: Partial<User> = {}): User {
  return {
    id: '83f3ec35-fb9b-41cb-8a18-746aba44aafa',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    passwordHash: 'hashed-password',
    createdAt,
    updatedAt,
    ...overrides,
  };
}

describe('AuthService', () => {
  let authRepository: jest.Mocked<AuthRepository>;
  let jwtService: jest.Mocked<JwtService>;
  let authService: AuthService;

  beforeEach(() => {
    authRepository = {
      checkEmailExists: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<AuthRepository>;
    jwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;
    authService = new AuthService(authRepository, jwtService);
  });

  it('registers a new user and returns a safe user with a token', async () => {
    const user = createUser({ passwordHash: 'stored-hash' });
    authRepository.checkEmailExists.mockResolvedValue(false);
    authRepository.create.mockResolvedValue(user);
    jwtService.signAsync.mockResolvedValue('signed-token');

    const result = await authService.register({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'TestPass123',
      confirmPassword: 'TestPass123',
    });

    expect(authRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
      }),
    );
    expect(authRepository.create.mock.calls[0]?.[0].passwordHash).not.toBe(
      'TestPass123',
    );
    expect(result).toEqual({
      token: 'signed-token',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('rejects duplicate registration emails', async () => {
    authRepository.checkEmailExists.mockResolvedValue(true);

    await expect(
      authService.register({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'TestPass123',
        confirmPassword: 'TestPass123',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('logs in a user with valid credentials', async () => {
    const passwordHash = await hash('TestPass123', 12);
    const user = createUser({ passwordHash });
    authRepository.findByEmail.mockResolvedValue(user);
    jwtService.signAsync.mockResolvedValue('signed-token');

    const result = await authService.login({
      email: 'ada@example.com',
      password: 'TestPass123',
    });

    expect(result.token).toBe('signed-token');
    expect(result.user).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
    });
  });

  it('rejects login when the email does not exist', async () => {
    authRepository.findByEmail.mockResolvedValue(null);

    await expect(
      authService.login({
        email: 'missing@example.com',
        password: 'TestPass123',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects login when the password is invalid', async () => {
    const passwordHash = await hash('TestPass123', 12);
    authRepository.findByEmail.mockResolvedValue(createUser({ passwordHash }));

    await expect(
      authService.login({
        email: 'ada@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns the authenticated user from a valid token', async () => {
    const user = createUser();
    jwtService.verifyAsync.mockResolvedValue({
      sub: user.id,
      email: user.email,
    });
    authRepository.findById.mockResolvedValue(user);

    const result = await authService.getAuthenticatedUser('signed-token');

    expect(result).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
    });
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects missing authentication tokens', async () => {
    await expect(authService.getAuthenticatedUser(undefined)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
