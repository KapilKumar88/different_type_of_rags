import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from '../../api/v1/auth/auth.service';
import { cookieConfig } from '../../config/cookie.config';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let reflector: jest.Mocked<Reflector>;
  let authService: jest.Mocked<AuthService>;
  let guard: JwtAuthGuard;

  function createContext(cookies?: Record<string, string>): ExecutionContext {
    const request = { cookies };

    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn(() => ({
        getRequest: jest.fn(() => request),
      })),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    authService = {
      getAuthenticatedUser: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;
    guard = new JwtAuthGuard(reflector, authService);
  });

  it('allows public routes without reading cookies', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);

    await expect(guard.canActivate(createContext())).resolves.toBe(true);

    expect(authService.getAuthenticatedUser).not.toHaveBeenCalled();
  });

  it('rejects requests without the auth cookie', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);

    await expect(guard.canActivate(createContext())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects invalid or expired JWTs', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    authService.getAuthenticatedUser.mockRejectedValue(
      new UnauthorizedException('Invalid authentication cookie'),
    );

    await expect(
      guard.canActivate(createContext({ [cookieConfig.name]: 'bad-token' })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('allows valid JWT cookies and attaches the current user', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const context = createContext({ [cookieConfig.name]: 'signed-token' });
    const request = context.switchToHttp().getRequest();
    const user = {
      id: '83f3ec35-fb9b-41cb-8a18-746aba44aafa',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    };
    authService.getAuthenticatedUser.mockResolvedValue(user);

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(authService.getAuthenticatedUser).toHaveBeenCalledWith(
      'signed-token',
    );
    expect(request.user).toEqual(user);
  });
});
