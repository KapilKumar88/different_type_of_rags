import { Injectable } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import {
  documentStructuredColumns,
  documentStructuredRows,
  documentStructuredTables,
  documents,
  type DocumentStructuredColumn,
  type DocumentStructuredRow,
  type DocumentStructuredTable,
  type NewDocumentStructuredColumn,
  type NewDocumentStructuredRow,
  type NewDocumentStructuredTable,
} from '../../../database/schemas';
import { DatabaseService } from '../../../services/database/database.service';

export type StructuredTableWithColumns = DocumentStructuredTable & {
  columns: DocumentStructuredColumn[];
};

export type StructuredTableWithRows = StructuredTableWithColumns & {
  rows: DocumentStructuredRow[];
  fileName: string;
};

export type CreateStructuredTableInput = {
  table: NewDocumentStructuredTable;
  columns: Omit<NewDocumentStructuredColumn, 'tableId'>[];
  rows: Omit<NewDocumentStructuredRow, 'tableId'>[];
};

@Injectable()
export class StructuredDocumentsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async createTables(
    tables: CreateStructuredTableInput[],
  ): Promise<StructuredTableWithColumns[]> {
    if (tables.length === 0) {
      return [];
    }

    return this.databaseService.instance.transaction(async (tx) => {
      const createdTables: StructuredTableWithColumns[] = [];

      for (const input of tables) {
        const [table] = await tx
          .insert(documentStructuredTables)
          .values(input.table)
          .returning();
        const columns = await tx
          .insert(documentStructuredColumns)
          .values(
            input.columns.map((column) => ({
              ...column,
              tableId: table.id,
            })),
          )
          .returning();

        if (input.rows.length > 0) {
          await tx.insert(documentStructuredRows).values(
            input.rows.map((row) => ({
              ...row,
              tableId: table.id,
            })),
          );
        }

        createdTables.push({ ...table, columns });
      }

      return createdTables;
    });
  }

  async findTablesByDocumentForUser(
    userId: string,
    documentId: string,
  ): Promise<StructuredTableWithRows[]> {
    const tableRows = await this.databaseService.instance
      .select({
        table: documentStructuredTables,
        document: documents,
      })
      .from(documentStructuredTables)
      .innerJoin(documents, eq(documentStructuredTables.documentId, documents.id))
      .where(
        and(eq(documents.userId, userId), eq(documents.id, documentId)),
      )
      .orderBy(asc(documentStructuredTables.createdAt));

    return this.attachColumnsAndRows(
      tableRows.map((row) => ({
        ...row.table,
        fileName: row.document.fileName,
      })),
      20,
    );
  }

  async findTablesByDocuments(
    documentIds: string[],
  ): Promise<StructuredTableWithRows[]> {
    if (documentIds.length === 0) {
      return [];
    }

    const tableRows = await this.databaseService.instance
      .select({
        table: documentStructuredTables,
        document: documents,
      })
      .from(documentStructuredTables)
      .innerJoin(documents, eq(documentStructuredTables.documentId, documents.id))
      .where(inArray(documentStructuredTables.documentId, documentIds))
      .orderBy(asc(documentStructuredTables.createdAt));

    return this.attachColumnsAndRows(
      tableRows.map((row) => ({
        ...row.table,
        fileName: row.document.fileName,
      })),
      20_000,
    );
  }

  private async attachColumnsAndRows(
    tables: (DocumentStructuredTable & { fileName: string })[],
    rowLimit: number,
  ): Promise<StructuredTableWithRows[]> {
    if (tables.length === 0) {
      return [];
    }

    const tableIds = tables.map((table) => table.id);
    const columns = await this.databaseService.instance
      .select()
      .from(documentStructuredColumns)
      .where(inArray(documentStructuredColumns.tableId, tableIds))
      .orderBy(asc(documentStructuredColumns.columnIndex));
    const allRows = await this.databaseService.instance
      .select()
      .from(documentStructuredRows)
      .where(inArray(documentStructuredRows.tableId, tableIds))
      .orderBy(asc(documentStructuredRows.rowIndex));
    const columnsByTable = this.groupByTableId(columns);
    const rowsByTable = this.groupByTableId(allRows);

    return tables.map((table) => ({
      ...table,
      columns: columnsByTable.get(table.id) ?? [],
      rows: (rowsByTable.get(table.id) ?? []).slice(0, rowLimit),
    }));
  }

  private groupByTableId<
    TItem extends { tableId: string },
  >(items: TItem[]): Map<string, TItem[]> {
    const grouped = new Map<string, TItem[]>();

    for (const item of items) {
      const group = grouped.get(item.tableId) ?? [];
      group.push(item);
      grouped.set(item.tableId, group);
    }

    return grouped;
  }
}
