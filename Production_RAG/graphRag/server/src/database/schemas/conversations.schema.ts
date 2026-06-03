import {
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import type { RetrievedChunk } from '../../types/rag.types';
import { documents } from './documents.schema';
import { users } from './users.schema';

export type ConversationMessageRole = 'user' | 'assistant';

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 180 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const conversationDocuments = pgTable(
  'conversation_documents',
  {
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.conversationId, table.documentId],
    }),
  ],
);

export const conversationMessages = pgTable('conversation_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 20 })
    .$type<ConversationMessageRole>()
    .notNull(),
  content: text('content').notNull(),
  sources: jsonb('sources').$type<RetrievedChunk[] | null>(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type ConversationDocument = typeof conversationDocuments.$inferSelect;
export type NewConversationDocument = typeof conversationDocuments.$inferInsert;
export type ConversationMessage = typeof conversationMessages.$inferSelect;
export type NewConversationMessage = typeof conversationMessages.$inferInsert;
