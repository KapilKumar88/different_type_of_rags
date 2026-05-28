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
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { documentUploadConfig } from '../../../config/document-upload.config';
import { ragRateLimitConfig } from '../../../config/rag-rate-limit.config';
import { CurrentUser } from '../../../guard/decorators/current-user.decorator';
import {
  authCookieSecurityName,
  csrfErrorResponse,
  csrfSecurityName,
  documentSchema,
  notFoundErrorResponse,
  rateLimitErrorResponse,
  serverErrorResponse,
  successEnvelope,
  unauthorizedErrorResponse,
  validationErrorResponse,
} from '../../../swagger/openapi';
import type { SafeUser } from '../../../types/auth.types';
import { documentIdSchema, type DocumentIdDto } from './dto/document-id.dto';
import {
  DocumentsService,
  type UploadedDocumentFile,
} from './documents.service';
import { DocumentUploadValidationPipe } from './pipes/document-upload-validation.pipe';

@ApiTags('Documents')
@ApiCookieAuth(authCookieSecurityName)
@Controller('api/v1/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @ApiSecurity(csrfSecurityName)
  @ApiOperation({
    summary: 'Upload, parse, chunk, embed, and index a document',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF, DOCX, TXT, or Markdown file',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Document uploaded and indexed successfully',
    schema: successEnvelope({
      type: 'object',
      required: ['document'],
      properties: { document: documentSchema },
    }),
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, ...validationErrorResponse })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    ...unauthorizedErrorResponse,
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, ...csrfErrorResponse })
  @ApiTooManyRequestsResponse(rateLimitErrorResponse)
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    ...serverErrorResponse,
  })
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
  @ApiOperation({ summary: 'List documents owned by the authenticated user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Documents retrieved successfully',
    schema: successEnvelope({
      type: 'object',
      required: ['documents'],
      properties: {
        documents: {
          type: 'array',
          items: documentSchema,
        },
      },
    }),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    ...unauthorizedErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    ...serverErrorResponse,
  })
  async list(@CurrentUser() user: SafeUser) {
    const documents = await this.documentsService.list(user.id);

    return {
      success: true,
      message: 'Documents retrieved successfully',
      data: { documents },
    };
  }

  @Delete(':id')
  @ApiSecurity(csrfSecurityName)
  @ApiOperation({ summary: 'Delete an owned document and its vector points' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document deleted successfully',
    schema: successEnvelope({
      type: 'object',
      required: ['document'],
      properties: { document: documentSchema },
    }),
  })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, ...validationErrorResponse })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    ...unauthorizedErrorResponse,
  })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, ...csrfErrorResponse })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, ...notFoundErrorResponse })
  @ApiResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    ...serverErrorResponse,
  })
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
