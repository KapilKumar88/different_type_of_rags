import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './api/v1/auth/auth.module';
import { ChatModule } from './api/v1/chat/chat.module';
import { CsrfModule } from './api/v1/csrf/csrf.module';
import { DocumentsModule } from './api/v1/documents/documents.module';
import { authRateLimitConfig } from './config/auth-rate-limit.config';
import { ragRateLimitConfig } from './config/rag-rate-limit.config';
import { JwtAuthGuard } from './guard/auth/jwt-auth.guard';
import { DatabaseModule } from './services/database/database.module';
import { Neo4jModule } from './services/neo4j/neo4j.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'auth',
        ttl: authRateLimitConfig.ttlMs,
        limit: authRateLimitConfig.limit,
      },
      {
        name: ragRateLimitConfig.upload.name,
        ttl: ragRateLimitConfig.upload.ttlMs,
        limit: ragRateLimitConfig.upload.limit,
      },
      {
        name: ragRateLimitConfig.chat.name,
        ttl: ragRateLimitConfig.chat.ttlMs,
        limit: ragRateLimitConfig.chat.limit,
      },
      {
        name: ragRateLimitConfig.stream.name,
        ttl: ragRateLimitConfig.stream.ttlMs,
        limit: ragRateLimitConfig.stream.limit,
      },
    ]),
    DatabaseModule,
    Neo4jModule,
    AuthModule,
    CsrfModule,
    DocumentsModule,
    ChatModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
