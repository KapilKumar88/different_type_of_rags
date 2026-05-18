import { ragConfig } from '../../../config/rag.config';
import type { RetrievedChunk } from '../../../types/rag.types';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { LlmService } from '../llm/llm.service';
import { QdrantService } from '../qdrant/qdrant.service';
import { ChatService } from './chat.service';

function createChunk(overrides: Partial<RetrievedChunk> = {}): RetrievedChunk {
  return {
    chunkId: 'chunk-1',
    documentId: 'document-1',
    fileName: 'rag-notes.txt',
    text: 'Naive RAG retrieves the most similar chunks before calling the LLM.',
    createdAt: '2026-01-01T00:00:00.000Z',
    score: 0.91,
    ...overrides,
  };
}

describe('ChatService', () => {
  let embeddingsService: jest.Mocked<EmbeddingsService>;
  let qdrantService: jest.Mocked<QdrantService>;
  let llmService: jest.Mocked<LlmService>;
  let chatService: ChatService;

  beforeEach(() => {
    embeddingsService = {
      embedQuery: jest.fn(),
    } as unknown as jest.Mocked<EmbeddingsService>;
    qdrantService = {
      search: jest.fn(),
    } as unknown as jest.Mocked<QdrantService>;
    llmService = {
      generateAnswer: jest.fn(),
    } as unknown as jest.Mocked<LlmService>;
    chatService = new ChatService(
      embeddingsService,
      qdrantService,
      llmService,
    );
  });

  it('embeds the question, retrieves top chunks, prompts the LLM, and returns sources', async () => {
    const questionVector = Array(768).fill(0.2);
    const source = createChunk({ pageNumber: 2 });
    embeddingsService.embedQuery.mockResolvedValue(questionVector);
    qdrantService.search.mockResolvedValue([source]);
    llmService.generateAnswer.mockResolvedValue(
      'Naive RAG retrieves similar chunks before answering.',
    );

    const result = await chatService.ask({
      question: 'How does Naive RAG answer?',
    });

    expect(embeddingsService.embedQuery).toHaveBeenCalledWith(
      'How does Naive RAG answer?',
    );
    expect(qdrantService.search).toHaveBeenCalledWith(
      questionVector,
      ragConfig.topK,
    );
    expect(llmService.generateAnswer).toHaveBeenCalledWith(
      expect.stringContaining('Context:\nSource 1 (rag-notes.txt page 2):'),
    );
    expect(llmService.generateAnswer).toHaveBeenCalledWith(
      expect.stringContaining('Question:\nHow does Naive RAG answer?'),
    );
    expect(result).toEqual({
      answer: 'Naive RAG retrieves similar chunks before answering.',
      sources: [source],
    });
  });

  it('returns the fallback answer without calling the LLM when no chunks are found', async () => {
    embeddingsService.embedQuery.mockResolvedValue(Array(768).fill(0.2));
    qdrantService.search.mockResolvedValue([]);

    const result = await chatService.ask({
      question: 'What is not in the document?',
    });

    expect(llmService.generateAnswer).not.toHaveBeenCalled();
    expect(result).toEqual({
      answer: ragConfig.fallbackAnswer,
      sources: [],
    });
  });

  it('falls back when the LLM returns an empty answer', async () => {
    embeddingsService.embedQuery.mockResolvedValue(Array(768).fill(0.2));
    qdrantService.search.mockResolvedValue([createChunk()]);
    llmService.generateAnswer.mockResolvedValue('');

    const result = await chatService.ask({
      question: 'What does the document say?',
    });

    expect(result.answer).toBe(ragConfig.fallbackAnswer);
  });
});
