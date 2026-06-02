import { Injectable } from '@nestjs/common';
import { ragConfig } from '../../config/rag.config';
import type {
  RagVectorType,
  RetrievedChunk,
  RetrievedVectorMatch,
} from '../../types/rag.types';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { QdrantService } from '../qdrant/qdrant.service';
import { RagConcurrencyLimiterService } from '../rag-runtime/rag-concurrency-limiter.service';
import type { FusedRetrievedChunk } from './multi-vector-rag.types';

@Injectable()
export class MultiVectorRetrievalService {
  constructor(
    private readonly embeddingsService: EmbeddingsService,
    private readonly qdrantService: QdrantService,
    private readonly ragConcurrencyLimiter: RagConcurrencyLimiterService,
  ) {}

  async retrieveByDocumentIds(
    question: string,
    documentIds: string[],
    topK: number,
  ): Promise<RetrievedChunk[]> {
    const questionVector = await this.ragConcurrencyLimiter.run(
      'embedding',
      () => this.embeddingsService.embedQuery(question),
    );
    const searchLimit = topK * ragConfig.multiVectorSearchMultiplier;
    const matches = await this.ragConcurrencyLimiter.run('qdrant-search', () =>
      this.qdrantService.searchByDocumentIds(
        questionVector,
        searchLimit,
        documentIds,
      ),
    );

    return this.fuseMatches(matches, topK);
  }

  fuseMatches(matches: RetrievedChunk[], topK: number): RetrievedChunk[] {
    const fusedByChunkId = new Map<string, FusedRetrievedChunk>();

    for (const matchSource of matches) {
      const match = this.getBestMatch(matchSource);
      const current = fusedByChunkId.get(matchSource.chunkId);

      if (!current) {
        fusedByChunkId.set(matchSource.chunkId, {
          chunkId: matchSource.chunkId,
          documentId: matchSource.documentId,
          fileName: matchSource.fileName,
          text: matchSource.text,
          createdAt: matchSource.createdAt,
          score: match.score,
          bestMatchType: match.vectorType,
          matches: [match],
          ...(matchSource.pageNumber === undefined
            ? {}
            : { pageNumber: matchSource.pageNumber }),
        });
        continue;
      }

      this.mergeMatch(current, match);
    }

    return [...fusedByChunkId.values()]
      .map((chunk) => ({
        ...chunk,
        matches: [...chunk.matches].sort((left, right) => {
          return right.score - left.score;
        }),
      }))
      .sort((left, right) => right.score - left.score)
      .slice(0, topK);
  }

  private mergeMatch(
    current: FusedRetrievedChunk,
    match: RetrievedVectorMatch,
  ): void {
    const existingMatchIndex = current.matches.findIndex((item) => {
      return item.vectorId === match.vectorId;
    });

    if (existingMatchIndex !== -1) {
      const existingMatch = current.matches[existingMatchIndex];

      if (existingMatch && match.score > existingMatch.score) {
        current.matches[existingMatchIndex] = match;
      }
    } else {
      current.matches.push(match);
    }

    const [initialMatch] = current.matches;

    if (!initialMatch) {
      return;
    }

    const highestMatch = current.matches.reduce((bestMatch, item) => {
      return item.score > bestMatch.score ? item : bestMatch;
    }, initialMatch);

    current.score = highestMatch.score;
    current.bestMatchType = highestMatch.vectorType;
  }

  private getBestMatch(source: RetrievedChunk): RetrievedVectorMatch {
    const sortedMatches = [...(source.matches ?? [])].sort((left, right) => {
      return right.score - left.score;
    });
    const [bestMatch] = sortedMatches;

    if (bestMatch) {
      return bestMatch;
    }

    return {
      vectorId: source.vectorId ?? source.chunkId,
      vectorType: source.vectorType ?? this.getBestMatchType(source),
      vectorText: source.vectorText ?? source.text,
      score: source.score,
    };
  }

  private getBestMatchType(source: RetrievedChunk): RagVectorType {
    return source.bestMatchType ?? 'original';
  }
}
