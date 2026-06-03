import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { ragConfig } from '../../../../config/rag.config';
import type { ParsedDocument } from '../../../../types/document-parsing.types';

export type ChildChunk = {
  text: string;
  pageNumber?: number;
};

export type ParentChunk = {
  parentIndex: number;
  text: string;
  pageNumber?: number;
  children: ChildChunk[];
};

const parentSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: ragConfig.parentChunkSize,
  chunkOverlap: ragConfig.parentChunkOverlap,
});

const childSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: ragConfig.childChunkSize,
  chunkOverlap: ragConfig.childChunkOverlap,
});

export async function splitDocumentIntoParents(
  documentText: ParsedDocument,
): Promise<ParentChunk[]> {
  const parents: ParentChunk[] = [];
  let parentIndex = 0;

  for (const page of documentText.pages) {
    const rawParents = await parentSplitter.splitText(page.text);
    const pageParents = rawParents
      .map((text) => text.trim())
      .filter((text) => text.length > 0);

    for (const parentText of pageParents) {
      const rawChildren = await childSplitter.splitText(parentText);
      const children: ChildChunk[] = rawChildren
        .map((text) => text.trim())
        .filter((text) => text.length > 0)
        .map((text) => {
          const child: ChildChunk = { text };

          if (page.pageNumber !== undefined) {
            child.pageNumber = page.pageNumber;
          }

          return child;
        });

      if (children.length === 0) {
        continue;
      }

      const parent: ParentChunk = {
        parentIndex,
        text: parentText,
        children,
      };

      if (page.pageNumber !== undefined) {
        parent.pageNumber = page.pageNumber;
      }

      parents.push(parent);
      parentIndex++;
    }
  }

  return parents;
}
