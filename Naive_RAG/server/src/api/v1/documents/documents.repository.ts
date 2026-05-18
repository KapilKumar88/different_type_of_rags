import { Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import {
  documents,
  type Document,
  type NewDocument,
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

  async findAll(): Promise<Document[]> {
    return this.databaseService.instance
      .select()
      .from(documents)
      .orderBy(desc(documents.createdAt));
  }

  async findById(id: string): Promise<Document | null> {
    const [document] = await this.databaseService.instance
      .select()
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    return document ?? null;
  }

  async deleteById(id: string): Promise<Document | null> {
    const [document] = await this.databaseService.instance
      .delete(documents)
      .where(eq(documents.id, id))
      .returning();

    return document ?? null;
  }
}
