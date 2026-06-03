import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { CurrentUser } from '../../../guard/decorators/current-user.decorator';
import type { SafeUser } from '../../../types/auth.types';
import { DocumentsRepository } from '../documents/documents.repository';
import {
  documentGraphIdSchema,
  type DocumentGraphIdDto,
} from './dto/document-graph-id.dto';
import { GraphService } from './graph.service';

@Controller('api/v1/graph')
export class GraphController {
  constructor(
    private readonly graphService: GraphService,
    private readonly documentsRepository: DocumentsRepository,
  ) {}

  @Get('documents/:documentId')
  async getDocumentGraph(
    @CurrentUser() user: SafeUser,
    @Param(new ZodValidationPipe(documentGraphIdSchema))
    params: DocumentGraphIdDto,
  ) {
    const document = await this.documentsRepository.findByIdForUser(
      user.id,
      params.documentId,
    );

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const graph = await this.graphService.getDocumentGraph(
      user.id,
      params.documentId,
    );

    return {
      success: true,
      message: 'Document graph retrieved successfully',
      data: { graph },
    };
  }
}
