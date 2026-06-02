import type { MessageEvent } from '@nestjs/common';
import type { ConversationMessage, Document } from '../../../database/schemas';
import type {
  RetrievedChunk,
  SelfRagRetrievalMetadata,
} from '../../../types/rag.types';
import { SelfRagService } from '../../../services/self-rag/self-rag.service';
import { DocumentsService } from '../documents/documents.service';
import { ChatRepository } from './chat.repository';
import { ChatService } from './chat.service';
import { updateConversationDocumentsSchema } from './dto/update-conversation-documents.dto';
import { updateConversationSchema } from './dto/update-conversation.dto';

function createChunk(overrides: Partial<RetrievedChunk> = {}): RetrievedChunk {
  return {
    chunkId: 'chunk-1',
    documentId: 'document-1',
    fileName: 'rag-notes.txt',
    text: 'Self-RAG evaluates retrieved chunks before answering.',
    createdAt: '2026-01-01T00:00:00.000Z',
    score: 0.91,
    ...overrides,
  };
}

function createDocumentRecord(overrides: Partial<Document> = {}): Document {
  return {
    id: 'document-1',
    userId: 'user-1',
    fileName: 'one.txt',
    mimeType: 'text/plain',
    sizeBytes: 10,
    chunkCount: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function createSelfRagMetadata(
  overrides: Partial<SelfRagRetrievalMetadata> = {},
): SelfRagRetrievalMetadata {
  return {
    originalQuery: 'What does this say?',
    generatedQueries: ['What does this say?'],
    usedQueryCount: 1,
    strategy: 'self_rag',
    createdAt: '2026-01-01T00:00:00.000Z',
    finalDecision: 'answered',
    attempts: [
      {
        attemptNumber: 1,
        seedQuery: 'What does this say?',
        generatedQueries: ['What does this say?'],
        retrievedChunkCount: 1,
        acceptedChunkCount: 1,
        rejectedChunkCount: 0,
        chunkEvaluations: [
          {
            chunkId: 'chunk-1',
            fileName: 'rag-notes.txt',
            score: 0.91,
            verdict: 'relevant',
            reason: 'Relevant to the question.',
          },
        ],
      },
    ],
    answerEvaluation: {
      verdict: 'supported',
      utility: 'high',
      reason: 'The answer is supported.',
    },
    ...overrides,
  };
}

async function collectEvents(
  stream: AsyncGenerator<MessageEvent>,
): Promise<MessageEvent[]> {
  const events: MessageEvent[] = [];

  for await (const event of stream) {
    events.push(event);
  }

  return events;
}

describe('ChatService', () => {
  let chatRepository: jest.Mocked<ChatRepository>;
  let documentsService: jest.Mocked<DocumentsService>;
  let selfRagService: jest.Mocked<SelfRagService>;
  let chatService: ChatService;
  const createdAt = new Date('2026-01-01T00:00:00.000Z');
  const updatedAt = new Date('2026-01-01T00:00:00.000Z');

  beforeEach(() => {
    chatRepository = {
      createConversation: jest.fn(),
      updateConversationTitle: jest.fn(),
      replaceConversationDocuments: jest.fn(),
      deleteConversation: jest.fn(),
      findConversationsByUser: jest.fn(),
      findConversationForUser: jest.fn(),
      findMessagesByConversation: jest.fn(),
      findMessageByConversation: jest.fn(),
      createMessage: jest.fn(),
    } as unknown as jest.Mocked<ChatRepository>;
    chatRepository.findMessagesByConversation.mockResolvedValue([]);
    documentsService = {
      findByIds: jest.fn(),
    } as unknown as jest.Mocked<DocumentsService>;
    selfRagService = {
      generateAnswer: jest.fn(),
    } as unknown as jest.Mocked<SelfRagService>;
    chatService = new ChatService(
      chatRepository,
      documentsService,
      selfRagService,
    );
  });

  it('creates a conversation with deduplicated selected documents', async () => {
    const conversation = {
      id: 'conversation-1',
      userId: 'user-1',
      title: 'Project docs',
      createdAt,
      updatedAt,
      documentIds: ['document-1', 'document-2'],
    };
    documentsService.findByIds.mockResolvedValue([
      createDocumentRecord(),
      createDocumentRecord({ id: 'document-2', fileName: 'two.txt' }),
    ]);
    chatRepository.createConversation.mockResolvedValue(conversation);

    const result = await chatService.createConversation('user-1', {
      title: 'Project docs',
      documentIds: ['document-1', 'document-2', 'document-1'],
    });

    expect(documentsService.findByIds).toHaveBeenCalledWith('user-1', [
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
    expect(result).toEqual(conversation);
  });

  it('rejects missing selected documents before creating a conversation', async () => {
    documentsService.findByIds.mockResolvedValue([createDocumentRecord()]);

    await expect(
      chatService.createConversation('user-1', {
        title: 'Project docs',
        documentIds: ['document-1', 'document-2'],
      }),
    ).rejects.toThrow('One or more selected documents were not found');
    expect(chatRepository.createConversation).not.toHaveBeenCalled();
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
        retrievalMetadata: null,
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

    expect(result).toEqual({
      ...conversation,
      messages,
    });
  });

  it('updates a conversation title after confirming ownership', async () => {
    const conversation = {
      id: 'conversation-1',
      userId: 'user-1',
      title: 'Project docs',
      createdAt,
      updatedAt,
      documentIds: ['document-1'],
    };
    const updatedConversation = {
      ...conversation,
      title: 'Flight ops research',
    };
    chatRepository.findConversationForUser.mockResolvedValue(conversation);
    chatRepository.updateConversationTitle.mockResolvedValue(
      updatedConversation,
    );

    const result = await chatService.updateConversation(
      'user-1',
      'conversation-1',
      {
        title: 'Flight ops research',
      },
    );

    expect(chatRepository.updateConversationTitle).toHaveBeenCalledWith(
      'conversation-1',
      'Flight ops research',
    );
    expect(result).toEqual(updatedConversation);
  });

  it('validates conversation title update payloads', () => {
    expect(() => updateConversationSchema.parse({ title: '' })).toThrow();
    expect(() =>
      updateConversationSchema.parse({ title: 'x'.repeat(181) }),
    ).toThrow();
    expect(
      updateConversationSchema.parse({ title: ' Research notes ' }),
    ).toEqual({
      title: 'Research notes',
    });
  });

  it('updates conversation documents after confirming ownership', async () => {
    const conversation = {
      id: 'conversation-1',
      userId: 'user-1',
      title: 'Project docs',
      createdAt,
      updatedAt,
      documentIds: ['document-1'],
    };
    const updatedConversation = {
      ...conversation,
      documentIds: ['document-1', 'document-2'],
    };
    chatRepository.findConversationForUser.mockResolvedValue(conversation);
    documentsService.findByIds.mockResolvedValue([
      createDocumentRecord(),
      createDocumentRecord({ id: 'document-2', fileName: 'two.txt' }),
    ]);
    chatRepository.replaceConversationDocuments.mockResolvedValue(
      updatedConversation,
    );

    const result = await chatService.updateConversationDocuments(
      'user-1',
      'conversation-1',
      {
        documentIds: ['document-1', 'document-2', 'document-1'],
      },
    );

    expect(chatRepository.replaceConversationDocuments).toHaveBeenCalledWith(
      'conversation-1',
      ['document-1', 'document-2'],
    );
    expect(result).toEqual(updatedConversation);
  });

  it('validates conversation document update payloads', () => {
    expect(() =>
      updateConversationDocumentsSchema.parse({ documentIds: [] }),
    ).toThrow();
    expect(() =>
      updateConversationDocumentsSchema.parse({ documentIds: ['not-a-uuid'] }),
    ).toThrow();
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
      retrievalMetadata: null,
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

  it('delegates answer context generation to Self-RAG with selected document ids', async () => {
    const conversation = {
      id: 'conversation-1',
      userId: 'user-1',
      title: 'Project docs',
      createdAt,
      updatedAt,
      documentIds: ['document-1', 'document-2'],
    };
    const sources = [createChunk()];
    const retrievalMetadata = createSelfRagMetadata();
    chatRepository.findConversationForUser.mockResolvedValue(conversation);
    chatRepository.findMessagesByConversation.mockResolvedValue([
      {
        id: 'message-1',
        conversationId: 'conversation-1',
        role: 'user',
        content: 'Earlier question',
        sources: null,
        retrievalMetadata: null,
        createdAt,
        updatedAt,
      },
    ]);
    selfRagService.generateAnswer.mockResolvedValue({
      answer: 'Answer.',
      sources,
      retrievalMetadata,
    });

    const result = await chatService.getConversationAnswerContext(
      'user-1',
      'conversation-1',
      'What does this say?',
    );

    expect(selfRagService.generateAnswer).toHaveBeenCalledWith({
      latestUserMessage: 'What does this say?',
      historyMessages: [
        {
          role: 'user',
          content: 'Earlier question',
        },
      ],
      documentIds: ['document-1', 'document-2'],
    });
    expect(result).toEqual({
      conversation,
      sources,
      retrievalMetadata,
    });
  });

  it('streams a gated Self-RAG answer with existing SSE event names', async () => {
    const conversation = {
      id: 'conversation-1',
      userId: 'user-1',
      title: 'Project docs',
      createdAt,
      updatedAt,
      documentIds: ['document-1'],
    };
    const userMessage: ConversationMessage = {
      id: 'message-3',
      conversationId: 'conversation-1',
      role: 'user',
      content: 'What is the current answer?',
      sources: null,
      retrievalMetadata: null,
      createdAt,
      updatedAt,
    };
    const history: ConversationMessage[] = [
      {
        id: 'message-1',
        conversationId: 'conversation-1',
        role: 'user',
        content: 'What is RAG?',
        sources: null,
        retrievalMetadata: null,
        createdAt,
        updatedAt,
      },
      {
        id: 'message-2',
        conversationId: 'conversation-1',
        role: 'assistant',
        content: 'RAG retrieves context before answering.',
        sources: [],
        retrievalMetadata: null,
        createdAt,
        updatedAt,
      },
      userMessage,
    ];
    const sources = [createChunk()];
    const retrievalMetadata = createSelfRagMetadata({
      originalQuery: 'What is the current answer?',
    });
    const assistantMessage: ConversationMessage = {
      id: 'message-4',
      conversationId: 'conversation-1',
      role: 'assistant',
      content: 'Final answer.',
      sources,
      retrievalMetadata,
      createdAt,
      updatedAt,
    };
    chatRepository.findConversationForUser.mockResolvedValue(conversation);
    chatRepository.findMessageByConversation.mockResolvedValue(userMessage);
    chatRepository.findMessagesByConversation.mockResolvedValue(history);
    selfRagService.generateAnswer.mockResolvedValue({
      answer: 'Final answer.',
      sources,
      retrievalMetadata,
    });
    chatRepository.createMessage.mockResolvedValue(assistantMessage);

    const events = await collectEvents(
      chatService.streamConversationAnswer(
        'user-1',
        'conversation-1',
        'message-3',
      ),
    );

    expect(selfRagService.generateAnswer).toHaveBeenCalledWith({
      latestUserMessage: 'What is the current answer?',
      historyMessages: [
        {
          role: 'user',
          content: 'What is RAG?',
        },
        {
          role: 'assistant',
          content: 'RAG retrieves context before answering.',
        },
      ],
      documentIds: ['document-1'],
    });
    expect(chatRepository.createMessage).toHaveBeenCalledWith({
      conversationId: 'conversation-1',
      role: 'assistant',
      content: 'Final answer.',
      sources,
      retrievalMetadata,
    });
    expect(events).toEqual([
      { type: 'sources', data: { sources, retrievalMetadata } },
      { type: 'token', data: { token: 'Final answer.' } },
      { type: 'done', data: { message: assistantMessage } },
    ]);
  });

  it('checks conversation ownership before looking up the stream message', async () => {
    chatRepository.findConversationForUser.mockResolvedValue(null);

    const events = await collectEvents(
      chatService.streamConversationAnswer(
        'user-2',
        'conversation-owned-by-user-1',
        'message-1',
      ),
    );

    expect(chatRepository.findMessageByConversation).not.toHaveBeenCalled();
    expect(selfRagService.generateAnswer).not.toHaveBeenCalled();
    expect(events).toEqual([
      {
        type: 'error',
        data: {
          code: 'not_found',
          message: 'Conversation or message not found',
        },
      },
    ]);
  });

  it('emits a stable stream error when Self-RAG generation fails', async () => {
    const conversation = {
      id: 'conversation-1',
      userId: 'user-1',
      title: 'Project docs',
      createdAt,
      updatedAt,
      documentIds: ['document-1'],
    };
    const userMessage: ConversationMessage = {
      id: 'message-1',
      conversationId: 'conversation-1',
      role: 'user',
      content: 'Answer?',
      sources: null,
      retrievalMetadata: null,
      createdAt,
      updatedAt,
    };
    chatRepository.findConversationForUser.mockResolvedValue(conversation);
    chatRepository.findMessageByConversation.mockResolvedValue(userMessage);
    selfRagService.generateAnswer.mockRejectedValue(
      new Error('provider key sk-test leaked in stack'),
    );

    const events = await collectEvents(
      chatService.streamConversationAnswer(
        'user-1',
        'conversation-1',
        'message-1',
      ),
    );

    expect(events).toEqual([
      {
        type: 'error',
        data: {
          code: 'stream_failed',
          message: 'Unable to stream assistant response',
        },
      },
    ]);
    expect(JSON.stringify(events)).not.toContain('sk-test');
    expect(chatRepository.createMessage).not.toHaveBeenCalled();
  });
});
