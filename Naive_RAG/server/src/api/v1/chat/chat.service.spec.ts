import { ragConfig } from '../../../config/rag.config';
import type { ConversationMessage } from '../../../database/schemas';
import type { RetrievedChunk } from '../../../types/rag.types';
import { DocumentsService } from '../documents/documents.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { LlmService } from '../llm/llm.service';
import { QdrantService } from '../qdrant/qdrant.service';
import { ChatRepository } from './chat.repository';
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
  let chatRepository: jest.Mocked<ChatRepository>;
  let documentsService: jest.Mocked<DocumentsService>;
  let chatService: ChatService;
  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const updatedAt = new Date('2026-01-01T00:00:00.000Z');

  beforeEach(() => {
    embeddingsService = {
      embedQuery: jest.fn(),
    } as unknown as jest.Mocked<EmbeddingsService>;
    qdrantService = {
      search: jest.fn(),
      searchByDocumentIds: jest.fn(),
    } as unknown as jest.Mocked<QdrantService>;
    llmService = {
      generateAnswer: jest.fn(),
    } as unknown as jest.Mocked<LlmService>;
    chatRepository = {
      createConversation: jest.fn(),
      findConversationsByUser: jest.fn(),
      findConversationForUser: jest.fn(),
      findMessagesByConversation: jest.fn(),
      createMessage: jest.fn(),
    } as unknown as jest.Mocked<ChatRepository>;
    documentsService = {
      findByIds: jest.fn(),
    } as unknown as jest.Mocked<DocumentsService>;
    chatService = new ChatService(
      embeddingsService,
      qdrantService,
      llmService,
      chatRepository,
      documentsService,
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

  it('creates a conversation with multiple selected documents', async () => {
    const conversation = {
      id: 'conversation-1',
      userId: 'user-1',
      title: 'Project docs',
      createdAt,
      updatedAt,
      documentIds: ['document-1', 'document-2'],
    };
    documentsService.findByIds.mockResolvedValue([
      {
        id: 'document-1',
        fileName: 'one.txt',
        mimeType: 'text/plain',
        sizeBytes: 10,
        chunkCount: 1,
        createdAt,
        updatedAt,
      },
      {
        id: 'document-2',
        fileName: 'two.txt',
        mimeType: 'text/plain',
        sizeBytes: 10,
        chunkCount: 1,
        createdAt,
        updatedAt,
      },
    ]);
    chatRepository.createConversation.mockResolvedValue(conversation);

    const result = await chatService.createConversation('user-1', {
      title: 'Project docs',
      documentIds: ['document-1', 'document-2'],
    });

    expect(chatRepository.createConversation).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        title: 'Project docs',
      },
      ['document-1', 'document-2'],
    );
    expect(result).toEqual(conversation);
  });

  it('deduplicates selected document ids before creating a conversation', async () => {
    const conversation = {
      id: 'conversation-1',
      userId: 'user-1',
      title: 'Project docs',
      createdAt,
      updatedAt,
      documentIds: ['document-1', 'document-2'],
    };
    documentsService.findByIds.mockResolvedValue([
      {
        id: 'document-1',
        fileName: 'one.txt',
        mimeType: 'text/plain',
        sizeBytes: 10,
        chunkCount: 1,
        createdAt,
        updatedAt,
      },
      {
        id: 'document-2',
        fileName: 'two.txt',
        mimeType: 'text/plain',
        sizeBytes: 10,
        chunkCount: 1,
        createdAt,
        updatedAt,
      },
    ]);
    chatRepository.createConversation.mockResolvedValue(conversation);

    await chatService.createConversation('user-1', {
      title: 'Project docs',
      documentIds: ['document-1', 'document-2', 'document-1'],
    });

    expect(documentsService.findByIds).toHaveBeenCalledWith([
      'document-1',
      'document-2',
    ]);
    expect(chatRepository.createConversation).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        title: 'Project docs',
      },
      ['document-1', 'document-2'],
    );
  });

  it('rejects missing selected documents before creating a conversation', async () => {
    documentsService.findByIds.mockResolvedValue([
      {
        id: 'document-1',
        fileName: 'one.txt',
        mimeType: 'text/plain',
        sizeBytes: 10,
        chunkCount: 1,
        createdAt,
        updatedAt,
      },
    ]);

    await expect(
      chatService.createConversation('user-1', {
        title: 'Project docs',
        documentIds: ['document-1', 'document-2'],
      }),
    ).rejects.toThrow('One or more selected documents were not found');
    expect(chatRepository.createConversation).not.toHaveBeenCalled();
  });

  it('uses a default title when creating a conversation without one', async () => {
    const conversation = {
      id: 'conversation-1',
      userId: 'user-1',
      title: 'New conversation',
      createdAt,
      updatedAt,
      documentIds: ['document-1'],
    };
    documentsService.findByIds.mockResolvedValue([
      {
        id: 'document-1',
        fileName: 'one.txt',
        mimeType: 'text/plain',
        sizeBytes: 10,
        chunkCount: 1,
        createdAt,
        updatedAt,
      },
    ]);
    chatRepository.createConversation.mockResolvedValue(conversation);

    await chatService.createConversation('user-1', {
      documentIds: ['document-1'],
    });

    expect(chatRepository.createConversation).toHaveBeenCalledWith(
      {
        userId: 'user-1',
        title: 'New conversation',
      },
      ['document-1'],
    );
  });

  it('fetches a conversation with saved messages in repository order', async () => {
    const conversation = {
      id: 'conversation-1',
      userId: 'user-1',
      title: 'Project docs',
      createdAt,
      updatedAt,
      documentIds: ['document-1'],
    };
    const messages: ConversationMessage[] = [
      {
        id: 'message-1',
        conversationId: 'conversation-1',
        role: 'user',
        content: 'What does the document say?',
        sources: null,
        createdAt,
        updatedAt,
      },
      {
        id: 'message-2',
        conversationId: 'conversation-1',
        role: 'assistant',
        content: 'It describes the RAG flow.',
        sources: [],
        createdAt,
        updatedAt,
      },
    ];
    chatRepository.findConversationForUser.mockResolvedValue(conversation);
    chatRepository.findMessagesByConversation.mockResolvedValue(messages);

    const result = await chatService.getConversation(
      'user-1',
      'conversation-1',
    );

    expect(chatRepository.findConversationForUser).toHaveBeenCalledWith(
      'conversation-1',
      'user-1',
    );
    expect(chatRepository.findMessagesByConversation).toHaveBeenCalledWith(
      'conversation-1',
    );
    expect(result).toEqual({
      ...conversation,
      messages,
    });
  });

  it('rejects access to another user conversation with not found', async () => {
    chatRepository.findConversationForUser.mockResolvedValue(null);

    await expect(
      chatService.getConversation('user-1', 'conversation-1'),
    ).rejects.toThrow('Conversation not found');
    expect(chatRepository.findMessagesByConversation).not.toHaveBeenCalled();
  });

  it('persists a user message only after confirming conversation ownership', async () => {
    const conversation = {
      id: 'conversation-1',
      userId: 'user-1',
      title: 'Project docs',
      createdAt,
      updatedAt,
      documentIds: ['document-1'],
    };
    const message: ConversationMessage = {
      id: 'message-1',
      conversationId: 'conversation-1',
      role: 'user',
      content: 'Summarize this.',
      sources: null,
      createdAt,
      updatedAt,
    };
    chatRepository.findConversationForUser.mockResolvedValue(conversation);
    chatRepository.createMessage.mockResolvedValue(message);

    const result = await chatService.createUserMessage(
      'user-1',
      'conversation-1',
      {
        content: 'Summarize this.',
      },
    );

    expect(chatRepository.createMessage).toHaveBeenCalledWith({
      conversationId: 'conversation-1',
      role: 'user',
      content: 'Summarize this.',
    });
    expect(result).toEqual(message);
  });

  it('retrieves conversation answer context using stored document ids', async () => {
    const conversation = {
      id: 'conversation-1',
      userId: 'user-1',
      title: 'Project docs',
      createdAt,
      updatedAt,
      documentIds: ['document-1', 'document-2'],
    };
    const questionVector = Array(768).fill(0.3);
    const sources = [
      createChunk({ documentId: 'document-1' }),
      createChunk({ chunkId: 'chunk-2', documentId: 'document-2' }),
    ];
    chatRepository.findConversationForUser.mockResolvedValue(conversation);
    embeddingsService.embedQuery.mockResolvedValue(questionVector);
    qdrantService.searchByDocumentIds.mockResolvedValue(sources);

    const result = await chatService.getConversationAnswerContext(
      'user-1',
      'conversation-1',
      'What does this say?',
    );

    expect(qdrantService.searchByDocumentIds).toHaveBeenCalledWith(
      questionVector,
      ragConfig.topK,
      ['document-1', 'document-2'],
    );
    expect(result).toEqual({
      conversation,
      sources,
    });
  });
});
