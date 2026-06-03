import { Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import type {
  DocumentParseInput,
  DocumentParser,
  ParsedDocument,
} from '../../../types/document-parsing.types';
import {
  createStructuredTable,
  createStructuredTableFromRecords,
} from '../helpers/structured-table.helpers';

@Injectable()
export class PlainTextDocumentParser implements DocumentParser {
  readonly supportedExtensions = ['.txt', '.md', '.csv', '.json'] as const;

  validateContentSignature(buffer: Buffer): boolean {
    return !buffer.subarray(0, Math.min(buffer.length, 1024)).includes(0);
  }

  async parse(input: DocumentParseInput): Promise<ParsedDocument> {
    const text = input.buffer.toString('utf8');
    const extension = input.fileName.toLowerCase().split('.').pop();

    return {
      pages: [{ text }],
      structuredTables: this.extractStructuredTables(extension, text),
    };
  }

  private extractStructuredTables(extension: string | undefined, text: string) {
    if (extension === 'csv') {
      return this.extractCsvTable(text);
    }

    if (extension === 'json') {
      return this.extractJsonTables(text);
    }

    if (extension === 'md') {
      return this.extractMarkdownTables(text);
    }

    return [];
  }

  private extractCsvTable(text: string) {
    const rows = parse(text, {
      bom: true,
      relaxColumnCount: true,
      skipEmptyLines: true,
      trim: true,
    }) as unknown[][];
    const table = createStructuredTable({
      tableKey: 'csv_table_1',
      title: 'CSV data',
      sourceType: 'csv',
      sourceLabel: 'CSV data',
      rows,
    });

    return table ? [table] : [];
  }

  private extractJsonTables(text: string) {
    const parsedJson = JSON.parse(text) as unknown;
    const records = this.findRecordArrays(parsedJson, '$');

    return records
      .map((entry, index) =>
        createStructuredTableFromRecords({
          tableKey: `json_table_${index + 1}`,
          title: entry.path,
          sourceType: 'json',
          sourceLabel: entry.path,
          records: entry.records,
        }),
      )
      .filter((table) => table !== null);
  }

  private extractMarkdownTables(text: string) {
    const lines = text.split(/\r?\n/);
    const tables = [];
    let tableIndex = 0;

    for (let index = 0; index < lines.length - 1; index += 1) {
      const header = lines[index];
      const separator = lines[index + 1];

      if (!this.isMarkdownTableLine(header) || !this.isMarkdownSeparator(separator)) {
        continue;
      }

      const rows = [this.parseMarkdownRow(header)];
      let rowIndex = index + 2;

      while (rowIndex < lines.length && this.isMarkdownTableLine(lines[rowIndex])) {
        rows.push(this.parseMarkdownRow(lines[rowIndex]));
        rowIndex += 1;
      }

      tableIndex += 1;
      const table = createStructuredTable({
        tableKey: `markdown_table_${tableIndex}`,
        title: `Markdown table ${tableIndex}`,
        sourceType: 'markdown',
        sourceLabel: `Markdown table ${tableIndex}`,
        rows,
      });

      if (table) {
        tables.push(table);
      }

      index = rowIndex - 1;
    }

    return tables;
  }

  private findRecordArrays(
    value: unknown,
    path: string,
  ): { path: string; records: Record<string, unknown>[] }[] {
    if (Array.isArray(value) && value.every((item) => this.isRecord(item))) {
      return [{ path, records: value }];
    }

    if (!this.isRecord(value)) {
      return [];
    }

    return Object.entries(value).flatMap(([key, child]) =>
      this.findRecordArrays(child, `${path}.${key}`),
    );
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private isMarkdownTableLine(line: string): boolean {
    return line.trim().startsWith('|') && line.trim().endsWith('|');
  }

  private isMarkdownSeparator(line: string): boolean {
    return /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(line);
  }

  private parseMarkdownRow(line: string): string[] {
    return line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());
  }
}
