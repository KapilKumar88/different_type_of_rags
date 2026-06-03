import { BadRequestException, Injectable } from '@nestjs/common';
import * as cheerio from 'cheerio';
import * as mammoth from 'mammoth';
import type {
  DocumentParseInput,
  DocumentParser,
  ParsedDocument,
} from '../../../types/document-parsing.types';
import type { ParsedStructuredTable } from '../../../types/rag.types';
import { createStructuredTable } from '../helpers/structured-table.helpers';

@Injectable()
export class DocxDocumentParser implements DocumentParser {
  readonly supportedExtensions = ['.docx'] as const;

  validateContentSignature(buffer: Buffer): boolean {
    return buffer.subarray(0, 2).toString('ascii') === 'PK';
  }

  async parse(input: DocumentParseInput): Promise<ParsedDocument> {
    try {
      const [textResult, htmlResult] = await Promise.all([
        mammoth.extractRawText({ buffer: input.buffer }),
        mammoth.convertToHtml({ buffer: input.buffer }),
      ]);

      return {
        pages: [{ text: textResult.value }],
        structuredTables: this.extractHtmlTables(htmlResult.value),
      };
    } catch {
      throw new BadRequestException(
        'Unable to extract text from DOCX document',
      );
    }
  }

  private extractHtmlTables(html: string) {
    const $ = cheerio.load(html);
    const tables: ParsedStructuredTable[] = [];

    $('table').each((tableIndex, tableElement) => {
      const rows: string[][] = [];

      $(tableElement)
        .find('tr')
        .each((_rowIndex, rowElement) => {
          const cells = $(rowElement)
            .find('th,td')
            .map((_cellIndex, cellElement) => $(cellElement).text().trim())
            .get();

          if (cells.length > 0) {
            rows.push(cells);
          }
        });

      const table = createStructuredTable({
        tableKey: `docx_table_${tableIndex + 1}`,
        title: `DOCX table ${tableIndex + 1}`,
        sourceType: 'docx',
        sourceLabel: `DOCX table ${tableIndex + 1}`,
        rows,
      });

      if (table) {
        tables.push(table);
      }
    });

    return tables;
  }
}
