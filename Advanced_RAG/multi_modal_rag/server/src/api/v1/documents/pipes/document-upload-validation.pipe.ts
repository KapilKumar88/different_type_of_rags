import {
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import { documentUploadConfig } from '../../../../config/document-upload.config';
import type { UploadedDocumentFile } from '../documents.service';
import { DocumentParsingService } from '../../../../services/parsing/document-parsing.service';

@Injectable()
export class DocumentUploadValidationPipe implements PipeTransform<
  UploadedDocumentFile | undefined,
  UploadedDocumentFile
> {
  constructor(
    private readonly documentParsingService: DocumentParsingService,
  ) {}

  transform(file: UploadedDocumentFile | undefined): UploadedDocumentFile {
    if (!file) {
      throw new BadRequestException('Document file is required');
    }

    if (!this.documentParsingService.isSupportedDocument(file.originalname)) {
      throw new BadRequestException(
        'Unsupported file type. Upload .txt, .md, .csv, .pdf, .docx, .png, .jpg, .jpeg, or .webp files.',
      );
    }

    if (file.size > documentUploadConfig.maxFileSizeBytes) {
      throw new BadRequestException('Document file is too large');
    }

    this.documentParsingService.validateDocumentFileType(
      file.originalname,
      file.mimetype,
      file.buffer,
    );

    return file;
  }
}
