import { Injectable } from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';
import {
  documentParents,
  documents,
  type Document,
  type NewDocument,
  type NewDocumentParent,
} from '../../../database/schemas';
import { DatabaseService } from '../../../services/database/database.service';

@Injectable()
export class DocumentsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(data: NewDocument): Promise<Document> {
    const [document] = await this.databaseService.instance
      .insert(documents)
      .values(data)
      .returning();

    return document;
  }

  async createWithParents(
    data: NewDocument,
    parents: NewDocumentParent[],
  ): Promise<Document> {
    return this.databaseService.instance.transaction(async (tx) => {
      const [document] = await tx
        .insert(documents)
        .values(data)
        .returning();

      if (parents.length > 0) {
        await tx.insert(documentParents).values(parents);
      }

      return document;
    });
  }

  async findAllByUser(userId: string): Promise<Document[]> {
    return this.databaseService.instance
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.createdAt));
  }

  async findByIdForUser(userId: string, id: string): Promise<Document | null> {
    const [document] = await this.databaseService.instance
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)))
      .limit(1);

    return document ?? null;
  }

  async findByIdsForUser(userId: string, ids: string[]): Promise<Document[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.databaseService.instance
      .select()
      .from(documents)
      .where(and(eq(documents.userId, userId), inArray(documents.id, ids)));
  }

  async deleteByIdForUser(
    userId: string,
    id: string,
  ): Promise<Document | null> {
    const [document] = await this.databaseService.instance
      .delete(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)))
      .returning();

    return document ?? null;
  }
}
