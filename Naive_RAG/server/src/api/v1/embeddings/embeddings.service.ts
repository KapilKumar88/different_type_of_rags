import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { OllamaEmbeddings } from '@langchain/ollama';
import { ollamaConfig } from '../../../config/ollama.config';
import { qdrantConfig } from '../../../config/qdrant.config';

@Injectable()
export class EmbeddingsService {
  private readonly embeddings = new OllamaEmbeddings({
    baseUrl: ollamaConfig.baseUrl,
    model: ollamaConfig.embeddingModel,
  });

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const vectors = await this.embeddings.embedDocuments(texts);
    vectors.forEach((vector) => this.assertVectorSize(vector));

    return vectors;
  }

  async embedQuery(text: string): Promise<number[]> {
    const vector = await this.embeddings.embedQuery(text);
    this.assertVectorSize(vector);

    return vector;
  }

  private assertVectorSize(vector: number[]): void {
    if (vector.length === qdrantConfig.vectorSize) {
      return;
    }

    throw new InternalServerErrorException(
      `Embedding vector size ${vector.length} does not match Qdrant vector size ${qdrantConfig.vectorSize}`,
    );
  }
}
