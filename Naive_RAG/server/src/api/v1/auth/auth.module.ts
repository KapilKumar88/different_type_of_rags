import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { authRateLimitConfig } from '../../../config/auth-rate-limit.config';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule,
    ThrottlerModule.forRoot([
      {
        name: 'auth',
        ttl: authRateLimitConfig.ttlMs,
        limit: authRateLimitConfig.limit,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository],
  exports: [AuthService],
})
export class AuthModule {}
