import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ragConfig } from '../../../config/rag.config';
import type { ConversationMessage } from '../../../database/schemas';
import type { RetrievedChunk } from '../../../types/rag.types';
import { DocumentsService } from '../documents/documents.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { LlmService } from '../llm/llm.service';
import { QdrantService } from '../qdrant/qdrant.service';
import {
  ChatRepository,
  type ConversationWithDocumentIds,
} from './chat.repository';
import type { AskQuestionDto } from './dto/ask-question.dto';
import type { CreateConversationDto } from './dto/create-conversation.dto';
import type { CreateMessageDto } from './dto/create-message.dto';

export type AskQuestionResult = {
  answer: string;
  sources: RetrievedChunk[];
};

export type ConversationSummary = ConversationWithDocumentIds;

export type ConversationDetails = ConversationWithDocumentIds & {
  messages: ConversationMessage[];
};

export type ConversationAnswerContext = {
  conversation: ConversationWithDocumentIds;
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
    private readonly chatRepository: ChatRepository,
    private readonly documentsService: DocumentsService,
  ) {}

  listConversations(userId: string): Promise<ConversationSummary[]> {
    return this.chatRepository.findConversationsByUser(userId);
  }

  async createConversation(
    userId: string,
    dto: CreateConversationDto,
  ): Promise<ConversationSummary> {
    const documentIds = await this.validateSelectedDocuments(dto.documentIds);

    return this.chatRepository.createConversation(
      {
        userId,
        title: dto.title ?? 'New conversation',
      },
      documentIds,
    );
  }

  async getConversation(
    userId: string,
    conversationId: string,
  ): Promise<ConversationDetails> {
    const conversation = await this.getOwnedConversation(
      userId,
      conversationId,
    );
    const messages =
      await this.chatRepository.findMessagesByConversation(conversationId);

    return {
      ...conversation,
      messages,
    };
  }

  async createUserMessage(
    userId: string,
    conversationId: string,
    dto: CreateMessageDto,
  ): Promise<ConversationMessage> {
    await this.getOwnedConversation(userId, conversationId);

    return this.chatRepository.createMessage({
      conversationId,
      role: 'user',
      content: dto.content,
    });
  }

  async getConversationAnswerContext(
    userId: string,
    conversationId: string,
    question: string,
  ): Promise<ConversationAnswerContext> {
    const conversation = await this.getOwnedConversation(
      userId,
      conversationId,
    );
    const questionVector = await this.embeddingsService.embedQuery(question);
    const sources = await this.qdrantService.searchByDocumentIds(
      questionVector,
      ragConfig.topK,
      conversation.documentIds,
    );

    return {
      conversation,
      sources,
    };
  }

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

  private async getOwnedConversation(
    userId: string,
    conversationId: string,
  ): Promise<ConversationWithDocumentIds> {
    const conversation = await this.chatRepository.findConversationForUser(
      conversationId,
      userId,
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  private async validateSelectedDocuments(
    documentIds: string[],
  ): Promise<string[]> {
    const uniqueDocumentIds = [...new Set(documentIds)];

    if (uniqueDocumentIds.length === 0) {
      throw new BadRequestException('Select at least one document');
    }

    const documents = await this.documentsService.findByIds(uniqueDocumentIds);

    if (documents.length !== uniqueDocumentIds.length) {
      throw new BadRequestException(
        'One or more selected documents were not found',
      );
    }

    return uniqueDocumentIds;
  }
}
