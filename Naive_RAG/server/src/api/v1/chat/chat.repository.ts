import { Injectable } from '@nestjs/common';
import { and, asc, desc, eq, inArray } from 'drizzle-orm';
import {
  conversationDocuments,
  conversationMessages,
  conversations,
  type Conversation,
  type ConversationMessage,
  type NewConversation,
  type NewConversationMessage,
} from '../../../database/schemas';
import { DatabaseService } from '../../../services/database/database.service';

export type ConversationWithDocumentIds = Conversation & {
  documentIds: string[];
};

@Injectable()
export class ChatRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async createConversation(
    data: NewConversation,
    documentIds: string[],
  ): Promise<ConversationWithDocumentIds> {
    return this.databaseService.instance.transaction(async (tx) => {
      const [conversation] = await tx
        .insert(conversations)
        .values(data)
        .returning();

      await tx.insert(conversationDocuments).values(
        documentIds.map((documentId) => ({
          conversationId: conversation.id,
          documentId,
        })),
      );

      return {
        ...conversation,
        documentIds,
      };
    });
  }

  async findConversationsByUser(
    userId: string,
  ): Promise<ConversationWithDocumentIds[]> {
    const rows = await this.databaseService.instance
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.updatedAt));

    return this.attachDocumentIds(rows);
  }

  async findConversationForUser(
    conversationId: string,
    userId: string,
  ): Promise<ConversationWithDocumentIds | null> {
    const [conversation] = await this.databaseService.instance
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId),
        ),
      )
      .limit(1);

    if (!conversation) {
      return null;
    }

    const [withDocumentIds] = await this.attachDocumentIds([conversation]);

    return withDocumentIds ?? null;
  }

  async findMessagesByConversation(
    conversationId: string,
  ): Promise<ConversationMessage[]> {
    return this.databaseService.instance
      .select()
      .from(conversationMessages)
      .where(eq(conversationMessages.conversationId, conversationId))
      .orderBy(asc(conversationMessages.createdAt));
  }

  async createMessage(
    data: NewConversationMessage,
  ): Promise<ConversationMessage> {
    return this.databaseService.instance.transaction(async (tx) => {
      const [message] = await tx
        .insert(conversationMessages)
        .values(data)
        .returning();

      await tx
        .update(conversations)
        .set({ updatedAt: new Date() })
        .where(eq(conversations.id, data.conversationId));

      return message;
    });
  }

  private async attachDocumentIds(
    rows: Conversation[],
  ): Promise<ConversationWithDocumentIds[]> {
    if (rows.length === 0) {
      return [];
    }

    const links = await this.databaseService.instance
      .select()
      .from(conversationDocuments)
      .where(
        inArray(
          conversationDocuments.conversationId,
          rows.map((row) => row.id),
        ),
      );

    const documentIdsByConversation = new Map<string, string[]>();

    for (const link of links) {
      const documentIds =
        documentIdsByConversation.get(link.conversationId) ?? [];
      documentIds.push(link.documentId);
      documentIdsByConversation.set(link.conversationId, documentIds);
    }

    return rows.map((row) => ({
      ...row,
      documentIds: documentIdsByConversation.get(row.id) ?? [],
    }));
  }
}
