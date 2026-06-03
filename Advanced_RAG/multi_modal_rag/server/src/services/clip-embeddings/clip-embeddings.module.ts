import { Module } from '@nestjs/common';
import { ClipEmbeddingsService } from './clip-embeddings.service';

@Module({
  providers: [ClipEmbeddingsService],
  exports: [ClipEmbeddingsService],
})
export class ClipEmbeddingsModule {}
