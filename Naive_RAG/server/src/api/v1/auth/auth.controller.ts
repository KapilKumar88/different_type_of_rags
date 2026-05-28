import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { authRateLimitConfig } from '../../../config/auth-rate-limit.config';
import { cookieConfig } from '../../../config/cookie.config';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../../guard/decorators/current-user.decorator';
import { Public } from '../../../guard/decorators/public.decorator';
import {
  authCookieSecurityName,
  rateLimitErrorResponse,
  safeUserSchema,
  serverErrorResponse,
  successEnvelope,
  unauthorizedErrorResponse,
  validationErrorResponse,
} from '../../../swagger/openapi';
import { AuthService } from './auth.service';
import type { AuthResult, SafeUser } from '../../../types/auth.types';
import { loginSchema, type LoginDto } from './dto/login.dto';
import { registerSchema, type RegisterDto } from './dto/register.dto';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Create an account and set the auth cookie' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'email', 'password', 'confirmPassword'],
      properties: {
        name: { type: 'string', minLength: 2, maxLength: 120 },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8, maxLength: 128 },
        confirmPassword: { type: 'string', minLength: 8, maxLength: 128 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Account created successfully',
    schema: successEnvelope({
      type: 'object',
      required: ['user'],
      properties: { user: safeUserSchema },
    }),
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, ...validationErrorResponse })
  @ApiTooManyRequestsResponse(rateLimitErrorResponse)
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    ...serverErrorResponse,
  })
  @UseGuards(ThrottlerGuard)
  @Throttle({
    auth: {
      limit: authRateLimitConfig.limit,
      ttl: authRateLimitConfig.ttlMs,
    },
  })
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authResult = await this.authService.register(dto);
    this.setAuthCookie(response, authResult);

    return {
      success: true,
      message: 'Account created successfully',
      data: { user: authResult.user },
    };
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Authenticate and set the auth cookie' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 8, maxLength: 128 },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    schema: successEnvelope({
      type: 'object',
      required: ['user'],
      properties: { user: safeUserSchema },
    }),
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, ...validationErrorResponse })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    ...unauthorizedErrorResponse,
  })
  @ApiTooManyRequestsResponse(rateLimitErrorResponse)
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    ...serverErrorResponse,
  })
  @UseGuards(ThrottlerGuard)
  @Throttle({
    auth: {
      limit: authRateLimitConfig.limit,
      ttl: authRateLimitConfig.ttlMs,
    },
  })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const authResult = await this.authService.login(dto);
    this.setAuthCookie(response, authResult);

    return {
      success: true,
      message: 'Login successful',
      data: { user: authResult.user },
    };
  }

  @Get('me')
  @ApiCookieAuth(authCookieSecurityName)
  @ApiOperation({ summary: 'Return the authenticated user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Authenticated user retrieved',
    schema: successEnvelope({
      type: 'object',
      required: ['user'],
      properties: { user: safeUserSchema },
    }),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    ...unauthorizedErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    ...serverErrorResponse,
  })
  me(@CurrentUser() user: SafeUser) {
    return {
      success: true,
      message: 'Authenticated user retrieved',
      data: { user },
    };
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'Clear the auth cookie' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Logout successful',
    schema: successEnvelope(null),
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    ...serverErrorResponse,
  })
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response) {
    this.clearAuthCookie(response);

    return {
      success: true,
      message: 'Logout successful',
      data: null,
    };
  }

  private setAuthCookie(response: Response, authResult: AuthResult): void {
    response.cookie(cookieConfig.name, authResult.token, {
      httpOnly: true,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      maxAge: cookieConfig.maxAgeMs,
      path: '/',
      domain: cookieConfig.domain,
    });
  }

  private clearAuthCookie(response: Response): void {
    response.clearCookie(cookieConfig.name, {
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      path: '/',
      domain: cookieConfig.domain,
    });
  }
}
