import { GUARDS_METADATA } from '@nestjs/common/constants';
import {
  THROTTLER_LIMIT,
  THROTTLER_TTL,
} from '@nestjs/throttler/dist/throttler.constants';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ragRateLimitConfig } from '../../../config/rag-rate-limit.config';
import { DocumentsController } from './documents.controller';

describe('DocumentsController rate limits', () => {
  it('applies upload throttling to document uploads', () => {
    const handler = DocumentsController.prototype.upload;
    const guards = Reflect.getMetadata(GUARDS_METADATA, handler);

    expect(guards).toContain(ThrottlerGuard);
    expect(
      Reflect.getMetadata(
        THROTTLER_LIMIT + ragRateLimitConfig.upload.name,
        handler,
      ),
    ).toBe(ragRateLimitConfig.upload.limit);
    expect(
      Reflect.getMetadata(
        THROTTLER_TTL + ragRateLimitConfig.upload.name,
        handler,
      ),
    ).toBe(ragRateLimitConfig.upload.ttlMs);
  });
});
