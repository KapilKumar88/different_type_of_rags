import type { INestApplication } from '@nestjs/common';
import helmet from 'helmet';

export function configureSecurityHeaders(app: INestApplication): void {
  app.use(
    helmet({
      frameguard: {
        action: 'deny',
      },
    }),
  );
}
