import { Injectable } from '@nestjs/common';
import { inArray } from 'drizzle-orm';
import {
  documentParents,
  type DocumentParent,
  type NewDocumentParent,
} from '../../../database/schemas';
import { DatabaseService } from '../../../services/database/database.service';

@Injectable()
export class DocumentParentsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async createMany(rows: NewDocumentParent[]): Promise<DocumentParent[]> {
    if (rows.length === 0) {
      return [];
    }

    return this.databaseService.instance
      .insert(documentParents)
      .values(rows)
      .returning();
  }

  async findByIds(ids: string[]): Promise<DocumentParent[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.databaseService.instance
      .select()
      .from(documentParents)
      .where(inArray(documentParents.id, ids));
  }
}
