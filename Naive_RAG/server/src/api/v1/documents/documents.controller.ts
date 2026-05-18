import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { documentIdSchema, type DocumentIdDto } from './dto/document-id.dto';
import {
  DocumentsService,
  type UploadedDocumentFile,
} from './documents.service';

@Controller('api/v1/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
    }),
  )
  async upload(@UploadedFile() file: UploadedDocumentFile | undefined) {
    const document = await this.documentsService.upload(file);

    return {
      success: true,
      message: 'Document uploaded and indexed successfully',
      data: { document },
    };
  }

  @Get()
  async list() {
    const documents = await this.documentsService.list();

    return {
      success: true,
      message: 'Documents retrieved successfully',
      data: { documents },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param(new ZodValidationPipe(documentIdSchema)) params: DocumentIdDto,
  ) {
    const document = await this.documentsService.delete(params.id);

    return {
      success: true,
      message: 'Document deleted successfully',
      data: { document },
    };
  }
}
