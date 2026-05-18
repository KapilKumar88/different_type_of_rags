import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { ragConfig } from '../../../../config/rag.config';
import type { ExtractedDocumentText } from './text-extractor';

export type TextChunk = {
  text: string;
  pageNumber?: number;
};

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: ragConfig.chunkSize,
  chunkOverlap: ragConfig.chunkOverlap,
});

export async function splitDocumentText(
  documentText: ExtractedDocumentText,
): Promise<TextChunk[]> {
  const chunks: TextChunk[] = [];

  for (const page of documentText.pages) {
    const pageChunks = await splitter.splitText(page.text);
    pageChunks
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0)
      .forEach((chunk) => {
        const textChunk: TextChunk = { text: chunk };

        if (page.pageNumber !== undefined) {
          textChunk.pageNumber = page.pageNumber;
        }

        chunks.push(textChunk);
      });
  }

  return chunks;
}
