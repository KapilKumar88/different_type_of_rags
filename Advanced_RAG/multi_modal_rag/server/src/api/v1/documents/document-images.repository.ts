import { Injectable } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import {
  documentImages,
  type DocumentImage,
  type NewDocumentImage,
} from '../../../database/schemas';
import { DatabaseService } from '../../../services/database/database.service';

@Injectable()
export class DocumentImagesRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async create(data: NewDocumentImage): Promise<DocumentImage> {
    const [image] = await this.databaseService.instance
      .insert(documentImages)
      .values(data)
      .returning();

    return image;
  }

  async findByIdForUser(
    userId: string,
    id: string,
  ): Promise<DocumentImage | null> {
    const [image] = await this.databaseService.instance
      .select()
      .from(documentImages)
      .where(and(eq(documentImages.id, id), eq(documentImages.userId, userId)))
      .limit(1);

    return image ?? null;
  }

  async findByIdsForUser(
    userId: string,
    ids: string[],
  ): Promise<DocumentImage[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.databaseService.instance
      .select()
      .from(documentImages)
      .where(
        and(
          eq(documentImages.userId, userId),
          inArray(documentImages.id, ids),
        ),
      )
      .orderBy(asc(documentImages.createdAt));
  }
}
