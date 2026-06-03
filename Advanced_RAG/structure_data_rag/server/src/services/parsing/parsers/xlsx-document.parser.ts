import { BadRequestException, Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import type {
  DocumentParseInput,
  DocumentParser,
  ParsedDocument,
} from '../../../types/document-parsing.types';
import {
  createStructuredTable,
  formatStructuredValue,
} from '../helpers/structured-table.helpers';

@Injectable()
export class XlsxDocumentParser implements DocumentParser {
  readonly supportedExtensions = ['.xlsx'] as const;

  validateContentSignature(buffer: Buffer): boolean {
    return buffer.subarray(0, 2).toString('ascii') === 'PK';
  }

  async parse(input: DocumentParseInput): Promise<ParsedDocument> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(
        input.buffer as unknown as Parameters<typeof workbook.xlsx.load>[0],
      );
      const structuredTables = workbook.worksheets
        .map((sheet, sheetIndex) => {
          const rows: unknown[][] = [];

          sheet.eachRow((row) => {
            const values = Array.isArray(row.values) ? row.values.slice(1) : [];
            rows.push(values);
          });

          return createStructuredTable({
            tableKey: `xlsx_sheet_${sheetIndex + 1}`,
            title: sheet.name || `Sheet ${sheetIndex + 1}`,
            sourceType: 'xlsx',
            sourceLabel: sheet.name || `Sheet ${sheetIndex + 1}`,
            rows,
          });
        })
        .filter((table) => table !== null);
      const text = structuredTables
        .map((table) => {
          const header = table.columns.map((column) => column.name).join(' | ');
          const rows = table.rows
            .slice(0, 50)
            .map((row) =>
              table.columns
                .map((column) => formatStructuredValue(row.values[column.key]))
                .join(' | '),
            )
            .join('\n');

          return `${table.title}\n${header}\n${rows}`;
        })
        .join('\n\n');

      return {
        pages: text ? [{ text }] : [],
        structuredTables,
      };
    } catch {
      throw new BadRequestException('Unable to extract data from XLSX document');
    }
  }
}
