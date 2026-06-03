import {
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import type {
  StructuredColumnValueType,
  StructuredTableSourceType,
  StructuredValue,
} from '../../types/rag.types';
import { documents } from './documents.schema';

export type StructuredRowValues = Record<string, StructuredValue>;

export const documentStructuredTables = pgTable(
  'document_structured_tables',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    tableKey: varchar('table_key', { length: 160 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    sourceType: varchar('source_type', { length: 40 })
      .$type<StructuredTableSourceType>()
      .notNull(),
    sourceLabel: varchar('source_label', { length: 255 }).notNull(),
    pageNumber: integer('page_number'),
    rowCount: integer('row_count').notNull(),
    columnCount: integer('column_count').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('document_structured_tables_document_id_idx').on(table.documentId),
    uniqueIndex('document_structured_tables_document_table_key_unique_idx').on(
      table.documentId,
      table.tableKey,
    ),
  ],
);

export const documentStructuredColumns = pgTable(
  'document_structured_columns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tableId: uuid('table_id')
      .notNull()
      .references(() => documentStructuredTables.id, { onDelete: 'cascade' }),
    columnKey: varchar('column_key', { length: 120 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    columnIndex: integer('column_index').notNull(),
    valueType: varchar('value_type', { length: 40 })
      .$type<StructuredColumnValueType>()
      .notNull(),
    nonNullCount: integer('non_null_count').notNull(),
    sampleValues: jsonb('sample_values').$type<StructuredValue[]>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('document_structured_columns_table_id_idx').on(table.tableId),
    uniqueIndex('document_structured_columns_table_column_key_unique_idx').on(
      table.tableId,
      table.columnKey,
    ),
  ],
);

export const documentStructuredRows = pgTable(
  'document_structured_rows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tableId: uuid('table_id')
      .notNull()
      .references(() => documentStructuredTables.id, { onDelete: 'cascade' }),
    rowIndex: integer('row_index').notNull(),
    values: jsonb('values').$type<StructuredRowValues>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('document_structured_rows_table_id_idx').on(table.tableId),
    uniqueIndex('document_structured_rows_table_row_index_unique_idx').on(
      table.tableId,
      table.rowIndex,
    ),
  ],
);

export type DocumentStructuredTable =
  typeof documentStructuredTables.$inferSelect;
export type NewDocumentStructuredTable =
  typeof documentStructuredTables.$inferInsert;
export type DocumentStructuredColumn =
  typeof documentStructuredColumns.$inferSelect;
export type NewDocumentStructuredColumn =
  typeof documentStructuredColumns.$inferInsert;
export type DocumentStructuredRow = typeof documentStructuredRows.$inferSelect;
export type NewDocumentStructuredRow = typeof documentStructuredRows.$inferInsert;
