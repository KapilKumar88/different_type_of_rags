import { Injectable, Logger } from '@nestjs/common';
import { webSearchConfig } from '../../config/web-search.config';
import type {
  CorrectiveRagWebSearchStatus,
  WebSearchSource,
} from '../../types/rag.types';

export type TavilySearchInput = {
  query: string;
};

export type TavilySearchResult = {
  provider: 'tavily';
  status: CorrectiveRagWebSearchStatus;
  query: string;
  results: WebSearchSource[];
  reason?: string;
};

type ParsedJsonObject = Record<string, unknown>;

const providerName = 'tavily';
const maxContentCharacters = 1200;
const maxTitleCharacters = 180;
const maxReasonCharacters = 160;

@Injectable()
export class TavilyWebSearchService {
  private readonly logger = new Logger(TavilyWebSearchService.name);

  async search(input: TavilySearchInput): Promise<TavilySearchResult> {
    const query = this.normalizeQuery(input.query);

    if (!query) {
      return this.createResult('failed', query, [], 'Search query is empty.');
    }

    if (!webSearchConfig.tavilyApiKey) {
      return this.createResult(
        'disabled',
        query,
        [],
        'Tavily API key is not configured.',
      );
    }

    try {
      const responseBody = await this.fetchSearchResults(query);
      const results = this.toSources(responseBody);

      if (results.length === 0) {
        return this.createResult(
          'no_results',
          query,
          [],
          'Tavily returned no usable results.',
        );
      }

      return this.createResult('searched', query, results);
    } catch (error) {
      this.logger.warn('Tavily web search failed', {
        errorName: error instanceof Error ? error.name : 'UnknownError',
      });

      return this.createResult(
        'failed',
        query,
        [],
        'Tavily search failed.',
      );
    }
  }

  private async fetchSearchResults(query: string): Promise<unknown> {
    const abortController = new AbortController();
    const timeout = setTimeout(() => {
      abortController.abort();
    }, webSearchConfig.timeoutMs);

    try {
      const response = await fetch(this.searchUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${webSearchConfig.tavilyApiKey ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          search_depth: 'basic',
          max_results: webSearchConfig.maxResults,
          include_answer: false,
          include_raw_content: false,
          include_images: false,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(`Tavily returned HTTP ${response.status}`);
      }

      return response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  private toSources(value: unknown): WebSearchSource[] {
    const results = this.getResults(value);

    return results
      .map((result, index) => this.toSource(result, index))
      .filter((source): source is WebSearchSource => source !== null)
      .slice(0, webSearchConfig.maxResults);
  }

  private getResults(value: unknown): ParsedJsonObject[] {
    if (!value || typeof value !== 'object') {
      return [];
    }

    const results = (value as ParsedJsonObject).results;

    if (!Array.isArray(results)) {
      return [];
    }

    return results.filter((result): result is ParsedJsonObject => {
      return Boolean(result) && typeof result === 'object';
    });
  }

  private toSource(
    result: ParsedJsonObject,
    index: number,
  ): WebSearchSource | null {
    const url = this.getString(result.url);
    const content = this.normalizeContent(this.getString(result.content));

    if (!url || !content) {
      return null;
    }

    return {
      sourceType: 'web',
      sourceId: this.createSourceId(url, index),
      title:
        this.truncateEnd(this.getString(result.title), maxTitleCharacters) ||
        url,
      url,
      content,
      score: this.getScore(result.score),
      provider: providerName,
      createdAt: new Date().toISOString(),
    };
  }

  private createResult(
    status: CorrectiveRagWebSearchStatus,
    query: string,
    results: WebSearchSource[],
    reason?: string,
  ): TavilySearchResult {
    const result: TavilySearchResult = {
      provider: providerName,
      status,
      query,
      results,
    };

    if (reason) {
      result.reason = this.truncateEnd(reason, maxReasonCharacters);
    }

    return result;
  }

  private get searchUrl(): string {
    return new URL('/search', webSearchConfig.tavilyBaseUrl).toString();
  }

  private normalizeQuery(value: string): string {
    return value.replace(/\s+/g, ' ').trim().slice(0, 500);
  }

  private normalizeContent(value: string): string {
    return this.truncateEnd(value.replace(/\s+/g, ' ').trim(), maxContentCharacters);
  }

  private getString(value: unknown): string {
    if (typeof value !== 'string') {
      return '';
    }

    return value.replace(/\s+/g, ' ').trim();
  }

  private getScore(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return 0;
    }

    return value;
  }

  private createSourceId(url: string, index: number): string {
    return `tavily-${index + 1}-${Buffer.from(url).toString('base64url').slice(0, 24)}`;
  }

  private truncateEnd(value: string, maxCharacters: number): string {
    if (value.length <= maxCharacters) {
      return value;
    }

    return value.slice(0, maxCharacters).trimEnd();
  }
}
