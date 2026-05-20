import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { configureCsrfProtection } from './common/security/csrf-protection';
import { configureSecurityHeaders } from './common/security/security-headers';
import { appConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureSecurityHeaders(app);
  app.enableCors({
    origin: appConfig.clientOrigin,
    credentials: true,
  });
  app.use(cookieParser());
  configureCsrfProtection(app);
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(appConfig.port);
}
bootstrap();
