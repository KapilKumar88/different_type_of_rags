import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { cookieConfig } from '../../../config/cookie.config';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { AuthService } from './auth.service';
import type { AuthResult, CookieRequest } from '../../../types/auth.types';
import { loginSchema, type LoginDto } from './dto/login.dto';
import { registerSchema, type RegisterDto } from './dto/register.dto';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
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

  @Post('login')
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
  async me(@Req() request: CookieRequest) {
    const user = await this.authService.getAuthenticatedUser(
      request.cookies?.[cookieConfig.name],
    );

    return {
      success: true,
      message: 'Authenticated user retrieved',
      data: { user },
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
}
