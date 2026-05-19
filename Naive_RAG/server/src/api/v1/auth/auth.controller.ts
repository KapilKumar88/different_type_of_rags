import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { cookieConfig } from '../../../config/cookie.config';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../../guard/decorators/current-user.decorator';
import { Public } from '../../../guard/decorators/public.decorator';
import { AuthService } from './auth.service';
import type { AuthResult, SafeUser } from '../../../types/auth.types';
import { loginSchema, type LoginDto } from './dto/login.dto';
import { registerSchema, type RegisterDto } from './dto/register.dto';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
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

  @Public()
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
  me(@CurrentUser() user: SafeUser) {
    return {
      success: true,
      message: 'Authenticated user retrieved',
      data: { user },
    };
  }

  @Public()
  @Post('logout')
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
