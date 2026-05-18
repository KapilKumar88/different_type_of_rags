import { Injectable } from '@nestjs/common';
import { ragConfig } from '../../../config/rag.config';
import type { RetrievedChunk } from '../../../types/rag.types';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { LlmService } from '../llm/llm.service';
import { QdrantService } from '../qdrant/qdrant.service';
import type { AskQuestionDto } from './dto/ask-question.dto';

export type AskQuestionResult = {
  answer: string;
  sources: RetrievedChunk[];
};

const promptTemplate = `You are a helpful assistant. Answer the user's question using only the provided context. If the answer is not available in the context, say: I could not find this information in the uploaded document.

Context:
{context}

Question:
{question}

Answer:`;

@Injectable()
export class ChatService {
  constructor(
    private readonly embeddingsService: EmbeddingsService,
    private readonly qdrantService: QdrantService,
    private readonly llmService: LlmService,
  ) {}

  async ask(dto: AskQuestionDto): Promise<AskQuestionResult> {
    // 1. Embed the user's question into the same vector space as the chunks.
    const questionVector = await this.embeddingsService.embedQuery(
      dto.question,
    );

    // 2. Retrieve only the top K most similar chunks from Qdrant.
    const sources = await this.qdrantService.search(
      questionVector,
      ragConfig.topK,
    );

    if (sources.length === 0) {
      return {
        answer: ragConfig.fallbackAnswer,
        sources: [],
      };
    }

    // 3. Put only the retrieved chunks into the prompt context.
    const context = this.formatContext(sources);
    const prompt = this.buildPrompt(context, dto.question);

    // 4. Ask the LLM to answer using only the retrieved context.
    const answer = await this.llmService.generateAnswer(prompt);

    return {
      answer: answer || ragConfig.fallbackAnswer,
      sources,
    };
  }

  private formatContext(sources: RetrievedChunk[]): string {
    return sources
      .map((source, index) => {
        const pageText =
          source.pageNumber === undefined ? '' : ` page ${source.pageNumber}`;

        return `Source ${index + 1} (${source.fileName}${pageText}):\n${source.text}`;
      })
      .join('\n\n');
  }

  private buildPrompt(context: string, question: string): string {
    return promptTemplate
      .replace('{context}', context)
      .replace('{question}', question);
  }
}
