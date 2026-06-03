import { BadRequestException, Injectable } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import type {
  DocumentParseInput,
  DocumentParser,
  ParsedDocument,
} from '../../../types/document-parsing.types';
import { createStructuredTable } from '../helpers/structured-table.helpers';

@Injectable()
export class PdfDocumentParser implements DocumentParser {
  readonly supportedExtensions = ['.pdf'] as const;

  validateContentSignature(buffer: Buffer): boolean {
    return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  }

  async parse(input: DocumentParseInput): Promise<ParsedDocument> {
    const parser = new PDFParse({ data: input.buffer });

    try {
      const [textResult, tableResult] = await Promise.all([
        parser.getText(),
        parser.getTable(),
      ]);
      const pages = textResult.pages.map((page) => ({
        text: page.text,
        pageNumber: page.num,
      }));
      const structuredTables = tableResult.pages.flatMap((page) => {
        return page.tables
          .map((rows, tableIndex) =>
            createPdfTable(page.num, tableIndex + 1, rows),
          )
          .filter((table) => table !== null);
      });

      return { pages, structuredTables };
    } catch {
      throw new BadRequestException('Unable to extract text from PDF document');
    } finally {
      await parser.destroy();
    }
  }
}

function createPdfTable(
  pageNumber: number,
  tableNumber: number,
  rows: string[][],
) {
  return createStructuredTable({
    tableKey: `pdf_page_${pageNumber}_table_${tableNumber}`,
    title: `PDF page ${pageNumber} table ${tableNumber}`,
    sourceType: 'pdf',
    sourceLabel: `Page ${pageNumber}, table ${tableNumber}`,
    pageNumber,
    rows,
  });
}
