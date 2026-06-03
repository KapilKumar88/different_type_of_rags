import { Module } from '@nestjs/common';
import { DocumentParsingService } from './document-parsing.service';
import { DocxDocumentParser } from './parsers/docx-document.parser';
import { ImageDocumentParser } from './parsers/image-document.parser';
import { PdfDocumentParser } from './parsers/pdf-document.parser';
import { PlainTextDocumentParser } from './parsers/plain-text-document.parser';

@Module({
  providers: [
    DocumentParsingService,
    PlainTextDocumentParser,
    PdfDocumentParser,
    DocxDocumentParser,
    ImageDocumentParser,
  ],
  exports: [DocumentParsingService],
})
export class DocumentParsingModule {}
