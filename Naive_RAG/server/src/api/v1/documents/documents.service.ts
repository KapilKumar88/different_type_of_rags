import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Document } from '../../../database/schemas';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { QdrantService } from '../qdrant/qdrant.service';
import type { VectorPoint } from '../../../types/rag.types';
import { DocumentsRepository } from './documents.repository';
import {
  extractDocumentText,
  isSupportedDocument,
} from './helpers/text-extractor';
import { splitDocumentText } from './helpers/text-splitter';

export type UploadedDocumentFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

@Injectable()
export class DocumentsService {
  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly embeddingsService: EmbeddingsService,
    private readonly qdrantService: QdrantService,
  ) {}

  async upload(file: UploadedDocumentFile | undefined): Promise<Document> {
    if (!file) {
      throw new BadRequestException('Document file is required');
    }

    if (!isSupportedDocument(file.originalname)) {
      throw new BadRequestException(
        'Unsupported file type. Upload .txt, .md, .csv, .pdf, or .docx files.',
      );
    }

    // 1. Extract readable text from the uploaded document.
    const extractedText = await extractDocumentText(
      file.originalname,
      file.buffer,
    );
    const text = extractedText.pages
      .map((page) => page.text)
      .join('\n')
      .trim();

    if (!text) {
      throw new BadRequestException(
        'No readable text was found in the document',
      );
    }

    // 2. Split the extracted text into small overlapping chunks.
    const chunks = await splitDocumentText(extractedText);

    if (chunks.length === 0) {
      throw new BadRequestException('No text chunks could be created');
    }

    const createdAt = new Date().toISOString();
    const documentId = randomUUID();

    // 3. Generate embeddings for every chunk.
    const vectors = await this.embeddingsService.embedDocuments(
      chunks.map((chunk) => chunk.text),
    );

    // 4. Store each chunk embedding and its payload as one Qdrant point.
    const points: VectorPoint[] = chunks.map((chunk, index) => {
      const chunkId = randomUUID();
      const payload = {
        chunkId,
        documentId,
        fileName: file.originalname,
        text: chunk.text,
        createdAt,
        ...(chunk.pageNumber !== undefined
          ? { pageNumber: chunk.pageNumber }
          : {}),
      };

      return {
        id: chunkId,
        vector: vectors[index] ?? [],
        payload,
      };
    });

    await this.qdrantService.upsertPoints(points);

    // 5. Persist document-level metadata for listing and deletion.
    return this.documentsRepository.create({
      id: documentId,
      fileName: file.originalname,
      mimeType: file.mimetype || 'application/octet-stream',
      sizeBytes: file.size,
      chunkCount: chunks.length,
    });
  }

  list(): Promise<Document[]> {
    return this.documentsRepository.findAll();
  }

  findByIds(ids: string[]): Promise<Document[]> {
    return this.documentsRepository.findByIds(ids);
  }

  async delete(id: string): Promise<Document> {
    const document = await this.documentsRepository.findById(id);

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    await this.qdrantService.deleteByDocumentId(id);
    const deletedDocument = await this.documentsRepository.deleteById(id);

    if (!deletedDocument) {
      throw new NotFoundException('Document not found');
    }

    return deletedDocument;
  }
}
