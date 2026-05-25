import { BadRequestException, Injectable } from '@nestjs/common';

import {
  documentUploadConfig,
  type SupportedDocumentExtension,
} from '../../config/document-upload.config';
import type {
  DocumentParser,
  ParsedDocument,
} from '../../types/document-parsing.types';
import { DocxDocumentParser } from './parsers/docx-document.parser';
import { PdfDocumentParser } from './parsers/pdf-document.parser';
import { PlainTextDocumentParser } from './parsers/plain-text-document.parser';
import {
  getFileExtension,
  normalizeMimeType,
} from 'src/common/helpers/file.helpers';

@Injectable()
export class DocumentParsingService {
  private readonly parserByExtension: Map<
    SupportedDocumentExtension,
    DocumentParser
  >;

  constructor(
    plainTextDocumentParser: PlainTextDocumentParser,
    pdfDocumentParser: PdfDocumentParser,
    docxDocumentParser: DocxDocumentParser,
  ) {
    const parsers: DocumentParser[] = [
      plainTextDocumentParser,
      pdfDocumentParser,
      docxDocumentParser,
    ];

    this.parserByExtension = new Map(
      parsers.flatMap((parser) =>
        parser.supportedExtensions.map(
          (extension): [SupportedDocumentExtension, DocumentParser] => [
            extension,
            parser,
          ],
        ),
      ),
    );
  }

  isSupportedDocument(fileName: string): boolean {
    return this.isSupportedExtension(getFileExtension(fileName));
  }

  validateDocumentFileType(
    fileName: string,
    mimeType: string | undefined,
    buffer: Buffer,
  ): void {
    const extension = this.getSupportedFileExtension(fileName);
    const normalizedMimeType = normalizeMimeType(mimeType);
    const allowedMimeTypes: readonly string[] =
      documentUploadConfig.allowedMimeTypesByExtension[extension];

    if (!allowedMimeTypes.includes(normalizedMimeType)) {
      throw new BadRequestException(
        'Uploaded document MIME type does not match the file extension',
      );
    }

    const parser = this.getParser(extension);

    if (!parser.validateContentSignature(buffer)) {
      throw new BadRequestException(
        'Uploaded document content does not match the file extension',
      );
    }
  }

  async parseDocument(
    fileName: string,
    mimeType: string | undefined,
    buffer: Buffer,
  ): Promise<ParsedDocument> {
    this.validateDocumentFileType(fileName, mimeType, buffer);

    const extension = this.getSupportedFileExtension(fileName);
    const parser = this.getParser(extension);

    return parser.parse({
      fileName,
      mimeType: normalizeMimeType(mimeType),
      buffer,
    });
  }

  private getSupportedFileExtension(
    fileName: string,
  ): SupportedDocumentExtension {
    const extension = getFileExtension(fileName);

    if (!this.isSupportedExtension(extension)) {
      throw new BadRequestException(
        'Unsupported file type. Upload .txt, .md, .csv, .pdf, or .docx files.',
      );
    }

    return extension;
  }

  private getParser(extension: SupportedDocumentExtension): DocumentParser {
    const parser = this.parserByExtension.get(extension);

    if (!parser) {
      throw new BadRequestException(
        'Unsupported file type. Upload .txt, .md, .csv, .pdf, or .docx files.',
      );
    }

    return parser;
  }

  private isSupportedExtension(
    extension: string,
  ): extension is SupportedDocumentExtension {
    return this.parserByExtension.has(extension as SupportedDocumentExtension);
  }
}
