import {
  customType,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { documents } from './documents.schema';
import { users } from './users.schema';

// Postgres `bytea` is not a built-in Drizzle column type. The postgres-js driver
// reads/writes bytea values as Node Buffers.
const bytea = customType<{ data: Buffer; default: false }>({
  dataType() {
    return 'bytea';
  },
});

export const documentImages = pgTable(
  'document_images',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    mimeType: varchar('mime_type', { length: 120 }).notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    pageNumber: integer('page_number'),
    source: varchar('source', { length: 20 }).notNull(),
    caption: text('caption'),
    data: bytea('data').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('document_images_document_id_idx').on(table.documentId),
    index('document_images_user_id_idx').on(table.userId),
  ],
);

export type DocumentImage = typeof documentImages.$inferSelect;
export type NewDocumentImage = typeof documentImages.$inferInsert;
