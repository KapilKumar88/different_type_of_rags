import { z } from 'zod';
import type {
  AdaptiveRagAnswerCheck,
  AdaptiveRagRoute,
  AdaptiveRagSourceGrade,
} from '../../types/adaptive-rag.types';
import type { RetrievedChunk } from '../../types/rag.types';
import { buildInvalidSourceGrades } from './adaptive-rag.prompts';

const routeSchema = z.object({
  route: z.enum(['document', 'fallback']),
});

const rewriteSchema = z.object({
  query: z.string().trim().min(1),
});

const sourceGradeSchema = z.object({
  grades: z.array(
    z.object({
      chunkId: z.string().trim().min(1),
      relevant: z.boolean(),
      reason: z.string().trim().max(200).optional(),
    }),
  ),
});

const answerCheckSchema = z.object({
  grounded: z.boolean(),
  useful: z.boolean(),
  reason: z.string().trim().max(200).optional(),
});

export function parseRouteResponse(response: string): AdaptiveRagRoute {
  const parsed = routeSchema.safeParse(parseJsonObject(response));

  if (!parsed.success) {
    return 'document';
  }

  return parsed.data.route;
}

export function parseRewriteResponse(
  response: string,
  fallbackQuery: string,
): string {
  const parsed = rewriteSchema.safeParse(parseJsonObject(response));

  if (!parsed.success) {
    return fallbackQuery;
  }

  return parsed.data.query;
}

export function parseSourceGradeResponse(
  response: string,
  sources: RetrievedChunk[],
): AdaptiveRagSourceGrade[] {
  const parsed = sourceGradeSchema.safeParse(parseJsonObject(response));

  if (!parsed.success) {
    return buildInvalidSourceGrades(sources);
  }

  return sources.map((source) => {
    const grade = parsed.data.grades.find(
      (item) => item.chunkId === source.chunkId,
    );

    return {
      chunkId: source.chunkId,
      documentId: source.documentId,
      relevant: grade?.relevant ?? false,
      score: source.score,
      reason: grade?.reason ?? 'Source was not present in grading response',
    };
  });
}

export function parseAnswerCheckResponse(
  response: string,
): AdaptiveRagAnswerCheck {
  const parsed = answerCheckSchema.safeParse(parseJsonObject(response));

  if (!parsed.success) {
    return {
      grounded: false,
      useful: false,
      reason: 'Unable to parse answer validation result',
    };
  }

  return parsed.data;
}

function parseJsonObject(response: string): unknown {
  const trimmedResponse = response.trim();

  try {
    return JSON.parse(trimmedResponse);
  } catch {
    return parseJsonObjectFromText(trimmedResponse);
  }
}

function parseJsonObjectFromText(response: string): unknown {
  const startIndex = response.indexOf('{');
  const endIndex = response.lastIndexOf('}');

  if (startIndex === -1 || endIndex <= startIndex) {
    return null;
  }

  try {
    return JSON.parse(response.slice(startIndex, endIndex + 1));
  } catch {
    return null;
  }
}
