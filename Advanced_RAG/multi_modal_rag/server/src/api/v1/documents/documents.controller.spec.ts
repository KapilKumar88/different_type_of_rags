import { NotFoundException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import {
  THROTTLER_LIMIT,
  THROTTLER_TTL,
} from '@nestjs/throttler/dist/throttler.constants';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Response } from 'express';
import { ragRateLimitConfig } from '../../../config/rag-rate-limit.config';
import type { DocumentImage } from '../../../database/schemas';
import { DocumentsController } from './documents.controller';
import type { DocumentsService } from './documents.service';
import type { SafeUser } from '../../../types/auth.types';

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

describe('DocumentsController image serving', () => {
  const user = { id: 'user-1', name: 'Test', email: 't@e.com' } as SafeUser;

  function createResponse(): jest.Mocked<Response> {
    return {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as jest.Mocked<Response>;
  }

  it('streams owned image bytes with the stored content type', async () => {
    const image = {
      mimeType: 'image/png',
      data: Buffer.from('png-bytes'),
    } as DocumentImage;
    const documentsService = {
      getImageForUser: jest.fn().mockResolvedValue(image),
    } as unknown as DocumentsService;
    const controller = new DocumentsController(documentsService);
    const res = createResponse();

    await controller.getImage(user, { imageId: 'image-1' }, res);

    expect(documentsService.getImageForUser).toHaveBeenCalledWith(
      'user-1',
      'image-1',
    );
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
    expect(res.send).toHaveBeenCalledWith(image.data);
  });

  it('returns not found when the image is not owned by the user', async () => {
    const documentsService = {
      getImageForUser: jest.fn().mockResolvedValue(null),
    } as unknown as DocumentsService;
    const controller = new DocumentsController(documentsService);

    await expect(
      controller.getImage(user, { imageId: 'image-1' }, createResponse()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
