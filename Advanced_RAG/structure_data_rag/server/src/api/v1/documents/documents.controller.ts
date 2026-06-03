import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { memoryStorage } from 'multer';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { documentUploadConfig } from '../../../config/document-upload.config';
import { ragRateLimitConfig } from '../../../config/rag-rate-limit.config';
import { CurrentUser } from '../../../guard/decorators/current-user.decorator';
import type { SafeUser } from '../../../types/auth.types';
import { documentIdSchema, type DocumentIdDto } from './dto/document-id.dto';
import {
  DocumentsService,
  type UploadedDocumentFile,
} from './documents.service';
import { DocumentUploadValidationPipe } from './pipes/document-upload-validation.pipe';

@Controller('api/v1/documents')
@ApiTags('Documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload and index a document for RAG' })
  @ApiResponse({ status: 201, description: 'Document uploaded and indexed' })
  @ApiResponse({ status: 400, description: 'Invalid upload' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  @ApiResponse({ status: 500, description: 'Upload failed' })
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
  @ApiOperation({ summary: 'List authenticated user documents' })
  @ApiResponse({ status: 200, description: 'Documents retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 500, description: 'Document listing failed' })
  async list(@CurrentUser() user: SafeUser) {
    const documents = await this.documentsService.list(user.id);

    return {
      success: true,
      message: 'Documents retrieved successfully',
      data: { documents },
    };
  }

  @Get(':id/tables')
  @ApiOperation({ summary: 'List structured tables for a document' })
  @ApiResponse({ status: 200, description: 'Structured tables retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  @ApiResponse({ status: 500, description: 'Table listing failed' })
  async listTables(
    @CurrentUser() user: SafeUser,
    @Param(new ZodValidationPipe(documentIdSchema)) params: DocumentIdDto,
  ) {
    const tables = await this.documentsService.findStructuredTables(
      user.id,
      params.id,
    );

    return {
      success: true,
      message: 'Structured tables retrieved successfully',
      data: { tables },
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a document and its indexed data' })
  @ApiResponse({ status: 200, description: 'Document deleted' })
  @ApiResponse({ status: 401, description: 'Unauthenticated' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiResponse({ status: 422, description: 'Validation failed' })
  @ApiResponse({ status: 500, description: 'Delete failed' })
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
