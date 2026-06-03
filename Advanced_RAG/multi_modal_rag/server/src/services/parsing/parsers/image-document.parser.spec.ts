import { BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import { ImageDocumentParser } from './image-document.parser';

async function createPng(size = 128): Promise<Buffer> {
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: 10, g: 120, b: 200 },
    },
  })
    .png()
    .toBuffer();
}

describe('ImageDocumentParser', () => {
  const parser = new ImageDocumentParser();

  it('accepts valid PNG and JPEG signatures', async () => {
    const png = await createPng();
    const jpeg = await sharp(png).jpeg().toBuffer();

    expect(parser.validateContentSignature(png)).toBe(true);
    expect(parser.validateContentSignature(jpeg)).toBe(true);
  });

  it('rejects buffers that are not images', () => {
    expect(parser.validateContentSignature(Buffer.from('not an image'))).toBe(
      false,
    );
  });

  it('normalizes a valid image into a single PNG ParsedImage', async () => {
    const result = await parser.parse({
      fileName: 'diagram.png',
      mimeType: 'image/png',
      buffer: await createPng(),
    });

    expect(result.pages).toEqual([]);
    expect(result.images).toHaveLength(1);
    expect(result.images[0]).toEqual(
      expect.objectContaining({
        mimeType: 'image/png',
        source: 'upload',
        width: 128,
        height: 128,
      }),
    );
    expect(result.images[0].data.length).toBeGreaterThan(0);
  });

  it('rejects undecodable image uploads', async () => {
    await expect(
      parser.parse({
        fileName: 'broken.png',
        mimeType: 'image/png',
        buffer: Buffer.from('still not an image'),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
