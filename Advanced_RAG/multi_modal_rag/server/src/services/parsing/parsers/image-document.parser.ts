import { BadRequestException, Injectable } from '@nestjs/common';
import type {
  DocumentParseInput,
  DocumentParser,
  ParsedDocument,
} from '../../../types/document-parsing.types';
import { normalizeImage } from '../helpers/image.helpers';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);

@Injectable()
export class ImageDocumentParser implements DocumentParser {
  readonly supportedExtensions = ['.png', '.jpg', '.jpeg', '.webp'] as const;

  validateContentSignature(buffer: Buffer): boolean {
    if (buffer.subarray(0, 4).equals(PNG_SIGNATURE)) {
      return true;
    }

    if (buffer.subarray(0, 3).equals(JPEG_SIGNATURE)) {
      return true;
    }

    // WEBP: "RIFF"<4 bytes size>"WEBP"
    const isRiff = buffer.subarray(0, 4).toString('ascii') === 'RIFF';
    const isWebp = buffer.subarray(8, 12).toString('ascii') === 'WEBP';

    return isRiff && isWebp;
  }

  async parse(input: DocumentParseInput): Promise<ParsedDocument> {
    const image = await normalizeImage(input.buffer, { source: 'upload' });

    if (!image) {
      throw new BadRequestException('Unable to read the uploaded image');
    }

    return {
      pages: [],
      images: [image],
    };
  }
}
