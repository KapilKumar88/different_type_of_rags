import { Module } from '@nestjs/common';
import { DocumentsRepository } from '../documents/documents.repository';
import { GraphExtractionModule } from '../../../services/graph-extraction/graph-extraction.module';
import { GraphController } from './graph.controller';
import { GraphRepository } from './graph.repository';
import { GraphService } from './graph.service';

@Module({
  imports: [GraphExtractionModule],
  controllers: [GraphController],
  providers: [GraphService, GraphRepository, DocumentsRepository],
  exports: [GraphService],
})
export class GraphModule {}
