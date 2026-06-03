import sharp from 'sharp';
import { documentUploadConfig } from '../../../config/document-upload.config';
import type {
  ParsedImage,
  ParsedImageSource,
} from '../../../types/document-parsing.types';

type NormalizeImageOptions = {
  source: ParsedImageSource;
  pageNumber?: number;
};

/**
 * Decode an arbitrary image buffer, drop alpha, downscale oversized images to a
 * bounded longest edge, and re-encode to PNG so every modality ends up in a
 * consistent, embeddable, displayable form.
 *
 * Returns `null` when the buffer is not a decodable image or is below the
 * minimum useful dimension (e.g. tiny decorative/tracking graphics in a PDF).
 */
export async function normalizeImage(
  buffer: Buffer,
  options: NormalizeImageOptions,
): Promise<ParsedImage | null> {
  try {
    const pipeline = sharp(buffer, { failOn: 'none' });
    const metadata = await pipeline.metadata();
    const sourceWidth = metadata.width ?? 0;
    const sourceHeight = metadata.height ?? 0;

    if (
      sourceWidth < documentUploadConfig.minExtractedImagePx &&
      sourceHeight < documentUploadConfig.minExtractedImagePx
    ) {
      return null;
    }

    const longestEdge = Math.max(sourceWidth, sourceHeight);
    const resizePipeline =
      longestEdge > documentUploadConfig.maxImageEdgePx
        ? pipeline.resize({
            width: documentUploadConfig.maxImageEdgePx,
            height: documentUploadConfig.maxImageEdgePx,
            fit: 'inside',
            withoutEnlargement: true,
          })
        : pipeline;

    const { data, info } = await resizePipeline
      .flatten({ background: '#ffffff' })
      .png()
      .toBuffer({ resolveWithObject: true });

    return {
      data,
      mimeType: 'image/png',
      width: info.width,
      height: info.height,
      pageNumber: options.pageNumber,
      source: options.source,
    };
  } catch {
    return null;
  }
}
