import type { Response } from 'express';
import { cookieConfig } from '../../../config/cookie.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { SafeUser } from '../../../types/auth.types';

describe('AuthController', () => {
  let authService: jest.Mocked<AuthService>;
  let authController: AuthController;

  const user: SafeUser = {
    id: '83f3ec35-fb9b-41cb-8a18-746aba44aafa',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
  };

  beforeEach(() => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;
    authController = new AuthController(authService);
  });

  it('sets an auth cookie after registration', async () => {
    const response = {
      cookie: jest.fn(),
    } as unknown as Response;
    authService.register.mockResolvedValue({
      token: 'signed-token',
      user,
    });

    const result = await authController.register(
      {
        name: user.name,
        email: user.email,
        password: 'TestPass123',
        confirmPassword: 'TestPass123',
      },
      response,
    );

    expect(response.cookie).toHaveBeenCalledWith(
      cookieConfig.name,
      'signed-token',
      expect.objectContaining({
        httpOnly: true,
        path: '/',
      }),
    );
    expect(result).toEqual({
      success: true,
      message: 'Account created successfully',
      data: { user },
    });
  });

  it('sets an auth cookie after login', async () => {
    const response = {
      cookie: jest.fn(),
    } as unknown as Response;
    authService.login.mockResolvedValue({
      token: 'signed-token',
      user,
    });

    const result = await authController.login(
      {
        email: user.email,
        password: 'TestPass123',
      },
      response,
    );

    expect(response.cookie).toHaveBeenCalledWith(
      cookieConfig.name,
      'signed-token',
      expect.objectContaining({
        httpOnly: true,
        path: '/',
      }),
    );
    expect(result).toEqual({
      success: true,
      message: 'Login successful',
      data: { user },
    });
  });

  it('returns the guard-provided authenticated user', () => {
    const result = authController.me(user);

    expect(result).toEqual({
      success: true,
      message: 'Authenticated user retrieved',
      data: { user },
    });
  });

  it('clears the auth cookie on logout', () => {
    const response = {
      clearCookie: jest.fn(),
    } as unknown as Response;

    const result = authController.logout(response);

    expect(response.clearCookie).toHaveBeenCalledWith(
      cookieConfig.name,
      expect.objectContaining({
        path: '/',
      }),
    );
    expect(result).toEqual({
      success: true,
      message: 'Logout successful',
      data: null,
    });
  });
});
