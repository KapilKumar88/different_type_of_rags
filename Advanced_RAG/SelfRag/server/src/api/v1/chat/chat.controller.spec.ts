import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  THROTTLER_LIMIT,
  THROTTLER_TTL,
} from '@nestjs/throttler/dist/throttler.constants';
import { ragRateLimitConfig } from '../../../config/rag-rate-limit.config';
import { ChatController } from './chat.controller';

function expectThrottle(
  handler: (...args: never[]) => unknown,
  name: string,
  limit: number,
  ttl: number,
): void {
  const guards = Reflect.getMetadata(GUARDS_METADATA, handler);

  expect(guards).toContain(ThrottlerGuard);
  expect(Reflect.getMetadata(THROTTLER_LIMIT + name, handler)).toBe(limit);
  expect(Reflect.getMetadata(THROTTLER_TTL + name, handler)).toBe(ttl);
}

describe('ChatController rate limits', () => {
  it('applies chat throttling to conversation creation', () => {
    expectThrottle(
      ChatController.prototype.createConversation,
      ragRateLimitConfig.chat.name,
      ragRateLimitConfig.chat.limit,
      ragRateLimitConfig.chat.ttlMs,
    );
  });

  it('applies chat throttling to conversation document scope updates', () => {
    expectThrottle(
      ChatController.prototype.updateConversationDocuments,
      ragRateLimitConfig.chat.name,
      ragRateLimitConfig.chat.limit,
      ragRateLimitConfig.chat.ttlMs,
    );
  });

  it('applies chat throttling to message creation', () => {
    expectThrottle(
      ChatController.prototype.createMessage,
      ragRateLimitConfig.chat.name,
      ragRateLimitConfig.chat.limit,
      ragRateLimitConfig.chat.ttlMs,
    );
  });

  it('applies stream throttling to SSE answer streaming', () => {
    expectThrottle(
      ChatController.prototype.streamMessage,
      ragRateLimitConfig.stream.name,
      ragRateLimitConfig.stream.limit,
      ragRateLimitConfig.stream.ttlMs,
    );
  });
});
