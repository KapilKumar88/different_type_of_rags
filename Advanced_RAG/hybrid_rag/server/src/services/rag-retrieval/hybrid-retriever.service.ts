import { Injectable } from '@nestjs/common';
import { ragConfig } from '../../config/rag.config';
import { QdrantService } from '../qdrant/qdrant.service';
import type { RetrievalMode, RetrievedChunk } from '../../types/rag.types';
import { SparseVectorizerService } from './sparse-vectorizer.service';

export type HybridRetrievalInput = {
  denseVector: number[];
  query: string;
  documentIds: string[];
  limit: number;
};

type FusionCandidate = RetrievedChunk & {
  denseScore?: number;
  sparseScore?: number;
  denseRank?: number;
  sparseRank?: number;
};

@Injectable()
export class HybridRetrieverService {
  constructor(
    private readonly qdrantService: QdrantService,
    private readonly sparseVectorizerService: SparseVectorizerService,
  ) {}

  async retrieveByDocumentIds(
    input: HybridRetrievalInput,
  ): Promise<RetrievedChunk[]> {
    if (input.documentIds.length === 0) {
      return [];
    }

    const sparseVector = this.sparseVectorizerService.vectorize(input.query);
    const candidateLimit = Math.max(
      input.limit,
      ragConfig.hybridCandidateLimit,
    );
    const [denseResults, sparseResults] = await Promise.all([
      this.qdrantService.searchDenseByDocumentIds(
        input.denseVector,
        candidateLimit,
        input.documentIds,
      ),
      this.qdrantService.searchSparseByDocumentIds(
        sparseVector,
        candidateLimit,
        input.documentIds,
      ),
    ]);

    return this.fuseResults(denseResults, sparseResults).slice(0, input.limit);
  }

  fuseResults(
    denseResults: RetrievedChunk[],
    sparseResults: RetrievedChunk[],
  ): RetrievedChunk[] {
    const candidates = new Map<string, FusionCandidate>();

    this.addRankedResults(candidates, denseResults, 'dense');
    this.addRankedResults(candidates, sparseResults, 'sparse');

    return Array.from(candidates.values())
      .map((candidate) => this.finalizeCandidate(candidate))
      .sort((left, right) => {
        if (right.score !== left.score) {
          return right.score - left.score;
        }

        return this.bestRank(left) - this.bestRank(right);
      });
  }

  private addRankedResults(
    candidates: Map<string, FusionCandidate>,
    results: RetrievedChunk[],
    source: 'dense' | 'sparse',
  ): void {
    results.forEach((result, index) => {
      const rank = index + 1;
      const existing = candidates.get(result.chunkId);
      const candidate = existing ?? { ...result, score: 0 };

      if (source === 'dense') {
        candidate.denseScore = result.score;
        candidate.denseRank = rank;
      } else {
        candidate.sparseScore = result.score;
        candidate.sparseRank = rank;
      }

      candidate.score += this.rankContribution(rank, source);
      candidates.set(result.chunkId, candidate);
    });
  }

  private rankContribution(rank: number, source: 'dense' | 'sparse'): number {
    const weight =
      source === 'dense'
        ? ragConfig.hybridDenseWeight
        : ragConfig.hybridSparseWeight;

    return weight / (ragConfig.hybridRrfK + rank);
  }

  private finalizeCandidate(candidate: FusionCandidate): RetrievedChunk {
    return {
      ...candidate,
      retrievalMode: this.getRetrievalMode(candidate),
    };
  }

  private getRetrievalMode(candidate: FusionCandidate): RetrievalMode {
    if (candidate.denseRank !== undefined && candidate.sparseRank !== undefined) {
      return 'hybrid';
    }

    if (candidate.sparseRank !== undefined) {
      return 'sparse';
    }

    return 'dense';
  }

  private bestRank(candidate: RetrievedChunk): number {
    const ranks = [candidate.denseRank, candidate.sparseRank].filter(
      (rank): rank is number => rank !== undefined,
    );

    if (ranks.length === 0) {
      return Number.MAX_SAFE_INTEGER;
    }

    return Math.min(...ranks);
  }
}
