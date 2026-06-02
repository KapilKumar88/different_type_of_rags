import { InternalServerErrorException } from '@nestjs/common';
import { LlmService } from '../llm/llm.service';
import { MultiVectorRepresentationService } from './multi-vector-representation.service';

const validResponse = JSON.stringify({
  chunks: [
    {
      chunkIndex: 0,
      summary: 'RAG retrieves relevant context before answering.',
      questions: [
        'How does RAG retrieve context?',
        'What happens before the answer is generated?',
        'What does the document say about retrieval?',
      ],
    },
  ],
});

describe('MultiVectorRepresentationService', () => {
  let llmService: jest.Mocked<LlmService>;
  let service: MultiVectorRepresentationService;

  beforeEach(() => {
    llmService = {
      generateAnswer: jest.fn(),
    } as unknown as jest.Mocked<LlmService>;
    service = new MultiVectorRepresentationService(llmService);
  });

  it('generates chunk summaries and hypothetical questions from strict JSON', async () => {
    llmService.generateAnswer.mockResolvedValue(`\`\`\`json\n${validResponse}\n\`\`\``);

    const result = await service.generateRepresentations([
      { text: 'RAG retrieves relevant context before answering.' },
    ]);

    expect(result).toEqual([
      {
        chunkIndex: 0,
        summary: 'RAG retrieves relevant context before answering.',
        questions: [
          'How does RAG retrieve context?',
          'What happens before the answer is generated?',
          'What does the document say about retrieval?',
        ],
      },
    ]);
  });

  it('retries once when the model response is not valid JSON', async () => {
    llmService.generateAnswer
      .mockResolvedValueOnce('not-json')
      .mockResolvedValueOnce(validResponse);

    await expect(
      service.generateRepresentations([{ text: 'Retryable chunk text.' }]),
    ).resolves.toHaveLength(1);
    expect(llmService.generateAnswer).toHaveBeenCalledTimes(2);
  });

  it('fails cleanly when generation remains invalid after retry', async () => {
    llmService.generateAnswer
      .mockResolvedValueOnce('not-json')
      .mockResolvedValueOnce(
        JSON.stringify({
          chunks: [{ chunkIndex: 0, summary: 'Too few questions', questions: [] }],
        }),
      );

    await expect(
      service.generateRepresentations([{ text: 'Unindexable chunk text.' }]),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
