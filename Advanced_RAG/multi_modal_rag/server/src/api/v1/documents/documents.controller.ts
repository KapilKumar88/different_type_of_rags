import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { documentUploadConfig } from '../../../config/document-upload.config';
import { ragRateLimitConfig } from '../../../config/rag-rate-limit.config';
import { CurrentUser } from '../../../guard/decorators/current-user.decorator';
import type { SafeUser } from '../../../types/auth.types';
import { documentIdSchema, type DocumentIdDto } from './dto/document-id.dto';
import { imageIdSchema, type ImageIdDto } from './dto/image-id.dto';
import {
  DocumentsService,
  type UploadedDocumentFile,
} from './documents.service';
import { DocumentUploadValidationPipe } from './pipes/document-upload-validation.pipe';

@Controller('api/v1/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @UseGuards(ThrottlerGuard)
  @Throttle({
    [ragRateLimitConfig.upload.name]: {
      limit: ragRateLimitConfig.upload.limit,
      ttl: ragRateLimitConfig.upload.ttlMs,
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        fileSize: documentUploadConfig.maxFileSizeBytes,
      },
    }),
  )
  async upload(
    @CurrentUser() user: SafeUser,
    @UploadedFile(DocumentUploadValidationPipe)
    file: UploadedDocumentFile,
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

  @Get('images/:imageId')
  async getImage(
    @CurrentUser() user: SafeUser,
    @Param(new ZodValidationPipe(imageIdSchema)) params: ImageIdDto,
    @Res() res: Response,
  ): Promise<void> {
    const image = await this.documentsService.getImageForUser(
      user.id,
      params.imageId,
    );

    if (!image) {
      throw new NotFoundException('Image not found');
    }

    res.setHeader('Content-Type', image.mimeType);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(image.data);
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
