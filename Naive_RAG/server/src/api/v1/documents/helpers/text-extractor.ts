import { BadRequestException } from '@nestjs/common';
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';
import path from 'node:path';

export type ExtractedTextPage = {
  text: string;
  pageNumber?: number;
};

export type ExtractedDocumentText = {
  pages: ExtractedTextPage[];
};

const supportedExtensions = new Set(['.txt', '.md', '.csv', '.pdf', '.docx']);

export function isSupportedDocument(fileName: string): boolean {
  return supportedExtensions.has(getFileExtension(fileName));
}

export async function extractDocumentText(
  fileName: string,
  buffer: Buffer,
): Promise<ExtractedDocumentText> {
  const extension = getFileExtension(fileName);

  if (!supportedExtensions.has(extension)) {
    throw new BadRequestException(
      'Unsupported file type. Upload .txt, .md, .csv, .pdf, or .docx files.',
    );
  }

  if (extension === '.pdf') {
    return extractPdfText(buffer);
  }

  if (extension === '.docx') {
    return extractDocxText(buffer);
  }

  return {
    pages: [{ text: buffer.toString('utf8') }],
  };
}

function getFileExtension(fileName: string): string {
  return path.extname(fileName).toLowerCase();
}

async function extractDocxText(buffer: Buffer): Promise<ExtractedDocumentText> {
  const result = await mammoth.extractRawText({ buffer });

  return {
    pages: [{ text: result.value }],
  };
}

async function extractPdfText(buffer: Buffer): Promise<ExtractedDocumentText> {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const pages = result.pages.map((page) => ({
      text: page.text,
      pageNumber: page.num,
    }));

    return { pages };
  } finally {
    await parser.destroy();
  }
}
