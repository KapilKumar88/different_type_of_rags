import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import neo4j, { Driver, QueryResult, Session } from 'neo4j-driver';
import { neo4jConfig } from '../../config/neo4j.config';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(Neo4jService.name);
  private readonly driver: Driver;

  constructor() {
    this.driver = neo4j.driver(
      neo4jConfig.uri,
      neo4j.auth.basic(neo4jConfig.username, neo4jConfig.password),
    );
  }

  async onModuleInit(): Promise<void> {
    await this.ensureConstraints();
  }

  async onModuleDestroy(): Promise<void> {
    await this.driver.close();
  }

  async read<T>(
    cypher: string,
    params: Record<string, unknown> = {},
  ): Promise<T[]> {
    const session = this.driver.session({
      database: neo4jConfig.database,
      defaultAccessMode: neo4j.session.READ,
    });

    try {
      const result: QueryResult = await session.run(cypher, params);

      return result.records.map((record) => record.toObject() as T);
    } finally {
      await session.close();
    }
  }

  async write<T>(
    cypher: string,
    params: Record<string, unknown> = {},
  ): Promise<T[]> {
    const session = this.driver.session({
      database: neo4jConfig.database,
      defaultAccessMode: neo4j.session.WRITE,
    });

    try {
      const result: QueryResult = await session.run(cypher, params);

      return result.records.map((record) => record.toObject() as T);
    } finally {
      await session.close();
    }
  }

  async writeInTransaction(
    work: (session: Session) => Promise<void>,
  ): Promise<void> {
    const session = this.driver.session({
      database: neo4jConfig.database,
      defaultAccessMode: neo4j.session.WRITE,
    });

    try {
      await session.executeWrite(async (tx) => {
        const txSession = {
          run: (cypher: string, params?: Record<string, unknown>) =>
            tx.run(cypher, params),
        } as unknown as Session;

        await work(txSession);
      });
    } finally {
      await session.close();
    }
  }

  async ensureConstraints(): Promise<void> {
    const statements = [
      'CREATE CONSTRAINT entity_id_unique IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE',
      'CREATE CONSTRAINT chunk_id_unique IF NOT EXISTS FOR (c:Chunk) REQUIRE c.id IS UNIQUE',
      'CREATE INDEX entity_scope_idx IF NOT EXISTS FOR (e:Entity) ON (e.userId, e.documentId)',
      'CREATE INDEX chunk_scope_idx IF NOT EXISTS FOR (c:Chunk) ON (c.userId, c.documentId)',
      'CREATE FULLTEXT INDEX entityNameIndex IF NOT EXISTS FOR (e:Entity) ON EACH [e.name, e.description]',
    ];

    for (const stmt of statements) {
      try {
        await this.write(stmt);
      } catch (error) {
        this.logger.warn(
          `Constraint/index setup statement skipped: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    this.logger.log('Neo4j constraints and indexes ensured');
  }
}
