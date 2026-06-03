import {
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import type { DocumentContentKind } from '../../types/rag.types';
import { users } from './users.schema';

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 120 }).notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    chunkCount: integer('chunk_count').notNull(),
    contentKind: varchar('content_kind', { length: 40 })
      .$type<DocumentContentKind>()
      .default('text')
      .notNull(),
    structuredTableCount: integer('structured_table_count')
      .default(0)
      .notNull(),
    structuredRowCount: integer('structured_row_count').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('documents_user_id_idx').on(table.userId)],
);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
