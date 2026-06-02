import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { databaseConfig } from '../../config/database.config';
import * as schema from '../../database/schemas';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly client: ReturnType<typeof postgres>;

  readonly instance: ReturnType<typeof drizzle<typeof schema>>;

  constructor() {
    this.client = postgres(databaseConfig.url, {
      max: databaseConfig.poolMax,
    });
    this.instance = drizzle(this.client, { schema });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.end({ timeout: 5 });
  }
}
