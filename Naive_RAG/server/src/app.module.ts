import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './api/v1/auth/auth.module';
import { ChatModule } from './api/v1/chat/chat.module';
import { CsrfModule } from './api/v1/csrf/csrf.module';
import { DocumentsModule } from './api/v1/documents/documents.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { JwtAuthGuard } from './guard/auth/jwt-auth.guard';
import { DatabaseModule } from './services/database/database.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    CsrfModule,
    DocumentsModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
