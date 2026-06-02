import { Injectable } from '@nestjs/common';
import { ragConfig } from '../../config/rag.config';
import type { SparseVector } from '../../types/rag.types';

const minTokenLength = 2;
const fnvOffsetBasis = 2_166_136_261;
const fnvPrime = 16_777_619;
const maxSparseIndex = 2_147_483_647;

@Injectable()
export class SparseVectorizerService {
  vectorize(text: string): SparseVector {
    const tokens = this.tokenize(text);

    if (tokens.length === 0) {
      return { indices: [], values: [] };
    }

    const counts = this.countTokens(tokens);
    const maxCount = Math.max(...counts.values());
    const entries = Array.from(counts.entries()).map(([token, count]) => ({
      index: this.hashToken(token),
      value: count / maxCount,
    }));
    const dedupedEntries = this.mergeHashCollisions(entries);
    const cappedEntries = dedupedEntries
      .sort((left, right) => {
        if (right.value !== left.value) {
          return right.value - left.value;
        }

        return left.index - right.index;
      })
      .slice(0, ragConfig.sparseMaxFeatures)
      .sort((left, right) => left.index - right.index);

    return {
      indices: cappedEntries.map((entry) => entry.index),
      values: cappedEntries.map((entry) => entry.value),
    };
  }

  tokenize(text: string): string[] {
    const rawTokens = text.match(/[A-Za-z0-9_]+/g) ?? [];

    return rawTokens.flatMap((token) => this.expandToken(token));
  }

  private expandToken(token: string): string[] {
    const parts = this.splitIdentifier(token);
    const normalizedToken = token.toLowerCase();
    const tokens = [normalizedToken, ...parts];
    const uniqueTokens = new Set<string>();

    for (const candidate of tokens) {
      if (candidate.length >= minTokenLength) {
        uniqueTokens.add(candidate);
      }
    }

    return [...uniqueTokens];
  }

  private splitIdentifier(token: string): string[] {
    return token
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .split(/[_\s]+/)
      .map((part) => part.toLowerCase())
      .filter((part) => part.length >= minTokenLength);
  }

  private countTokens(tokens: string[]): Map<string, number> {
    const counts = new Map<string, number>();

    for (const token of tokens) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }

    return counts;
  }

  private mergeHashCollisions(
    entries: Array<{ index: number; value: number }>,
  ): Array<{ index: number; value: number }> {
    const valuesByIndex = new Map<number, number>();

    for (const entry of entries) {
      valuesByIndex.set(entry.index, (valuesByIndex.get(entry.index) ?? 0) + entry.value);
    }

    return Array.from(valuesByIndex.entries()).map(([index, value]) => ({
      index,
      value,
    }));
  }

  private hashToken(token: string): number {
    let hash = fnvOffsetBasis;

    for (let index = 0; index < token.length; index += 1) {
      hash ^= token.charCodeAt(index);
      hash = Math.imul(hash, fnvPrime);
    }

    return (hash >>> 0) % maxSparseIndex;
  }
}
