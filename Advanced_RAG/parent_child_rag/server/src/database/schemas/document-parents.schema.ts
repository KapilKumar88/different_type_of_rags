import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { documents } from './documents.schema';

export const documentParents = pgTable(
  'document_parents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    parentIndex: integer('parent_index').notNull(),
    text: text('text').notNull(),
    pageNumber: integer('page_number'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('document_parents_document_id_idx').on(table.documentId)],
);

export type DocumentParent = typeof documentParents.$inferSelect;
export type NewDocumentParent = typeof documentParents.$inferInsert;
