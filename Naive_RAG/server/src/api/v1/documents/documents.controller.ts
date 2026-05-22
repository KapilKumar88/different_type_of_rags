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
import { CurrentUser } from '../../../guard/decorators/current-user.decorator';
import type { SafeUser } from '../../../types/auth.types';
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
  async upload(
    @CurrentUser() user: SafeUser,
    @UploadedFile() file: UploadedDocumentFile | undefined,
  ) {
    const document = await this.documentsService.upload(user.id, file);

    return {
      success: true,
      message: 'Document uploaded and indexed successfully',
      data: { document },
    };
  }

  @Get()
  async list(@CurrentUser() user: SafeUser) {
    const documents = await this.documentsService.list(user.id);

    return {
      success: true,
      message: 'Documents retrieved successfully',
      data: { documents },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @CurrentUser() user: SafeUser,
    @Param(new ZodValidationPipe(documentIdSchema)) params: DocumentIdDto,
  ) {
    const document = await this.documentsService.delete(user.id, params.id);

    return {
      success: true,
      message: 'Document deleted successfully',
      data: { document },
    };
  }
}
